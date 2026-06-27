/**
 * Server-side MQTT publish helper for EMQX Cloud Serverless.
 *
 * Used by the in-dashboard "Run Attack" runners (M1, M3, M5, M7) so the
 * attacks reach the real broker the same way a misbehaving ESP32 station
 * would. Backend never publishes telemetry in production — its broker
 * credentials are READ-ONLY per the ACL in EMQX_ACL_INSTRUCTIONS.md.
 *
 * This file deliberately uses short-lived connections (connect → publish →
 * end) so every attack run is independent and observable in the EMQX
 * dashboard's Sessions panel.
 */
import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import fs from "fs";
import path from "path";

export type ConnectOpts = {
    /** Override default backend creds. e.g. attack scripts pretending to be STATION-DEMO01. */
    username?: string;
    password?: string;
    /** clientid the broker sees. ACL is enforced against this. */
    clientid?: string;
    /** Set true to deliberately omit credentials (for M1 anonymous-CONNECT demo). */
    anonymous?: boolean;
    /** Override TLS — set false to force plain TCP for misconfig demos. */
    useTls?: boolean;
};

export type PublishResult = {
    accepted: boolean;
    error?: string;
    rttMs: number;
};

function loadCa(): Buffer | undefined {
    const p = process.env.EMQX_BROKER_CA_PATH;
    if (!p) return undefined;
    const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    try {
        return fs.readFileSync(abs);
    } catch {
        return undefined;
    }
}

function buildOptions(opts: ConnectOpts): IClientOptions {
    const useTls = opts.useTls ?? (process.env.EMQX_BROKER_USE_TLS === "true");
    const port = useTls
        ? parseInt(process.env.EMQX_BROKER_PORT ?? "8883", 10)
        : 1883;

    const o: IClientOptions = {
        host: process.env.EMQX_BROKER_HOST ?? "localhost",
        port,
        protocol: useTls ? "mqtts" : "mqtt",
        clientId:
            opts.clientid ??
            `logixair-${Math.random().toString(36).slice(2, 10)}`,
        reconnectPeriod: 0,        // single-shot for attack runners
        connectTimeout: 8000,
        rejectUnauthorized: true,
    };

    if (useTls) {
        const ca = loadCa();
        if (ca) o.ca = ca;
    }

    if (!opts.anonymous) {
        o.username =
            opts.username ?? process.env.EMQX_BACKEND_USERNAME ?? undefined;
        o.password =
            opts.password ?? process.env.EMQX_BACKEND_PASSWORD ?? undefined;
    }

    return o;
}

function once(client: MqttClient, event: string): Promise<unknown> {
    return new Promise((resolve) => client.once(event as never, resolve as never));
}

export type PublishOpts = ConnectOpts & {
    /** MQTT retain flag — set true for M5 retained-message-poison demo. Default false. */
    retain?: boolean;
    /** MQTT QoS — default 1. */
    qos?: 0 | 1 | 2;
};

/**
 * Connect, publish ONE message, disconnect. Returns whether the broker
 * accepted the connection + publish.
 */
export async function publishOnce(
    topic: string,
    payload: string | Buffer,
    opts: PublishOpts = {},
): Promise<PublishResult> {
    const start = Date.now();
    const o = buildOptions(opts);
    const qos = opts.qos ?? 1;
    const retain = opts.retain ?? false;

    return new Promise((resolve) => {
        let resolved = false;
        const finish = (r: PublishResult) => {
            if (!resolved) {
                resolved = true;
                resolve(r);
            }
        };

        const client = mqtt.connect(o);

        client.on("connect", () => {
            client.publish(
                topic,
                payload,
                { qos, retain },
                (err) => {
                    client.end(true, () => {
                        finish({
                            accepted: !err,
                            error: err?.message,
                            rttMs: Date.now() - start,
                        });
                    });
                },
            );
        });

        client.on("error", (err) => {
            client.end(true, () => {
                finish({
                    accepted: false,
                    error: err.message,
                    rttMs: Date.now() - start,
                });
            });
        });

        // hard timeout
        setTimeout(() => {
            client.end(true);
            finish({ accepted: false, error: "timeout", rttMs: Date.now() - start });
        }, 10_000);
    });
}
