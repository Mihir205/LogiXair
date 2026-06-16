/**
 * Device-registry guard (Cyberattack #9 — rogue / unauthorised node join).
 *
 * Threat: an attacker provisions a brand-new ESP32+LoRa node, invents a
 * `device_id` like "ROGUE-NODE-99", and starts publishing telemetry. If
 * the backend accepts any device_id by default, the attacker silently
 * pollutes the dataset with fabricated readings.
 *
 * Defense: explicit allow-list. Only device_ids registered in
 * REGISTERED_DEVICES (or in production: Firestore `stations` collection)
 * are accepted. Everything else returns 403 and writes one audit doc.
 *
 * Why this is continuously monitored: an attacker can attempt to join
 * at ANY time. The "Cyber Demos" page surfaces a card that re-runs the
 * attack on demand and the Sentinel auto-watches for rogue activity.
 */

// FLIP FOR BEFORE/AFTER ROGUE-NODE screenshots.
export const DEVICE_REGISTRY_ENABLED = true;

// Production: read from Firestore `stations` collection via admin SDK.
const REGISTERED_DEVICES: ReadonlySet<string> = new Set([
    "DEMO-NODE-01",
    "DEMO-NODE-02",
]);

export type DeviceDecision =
    | { accepted: true; reason: "registered" | "guard_disabled" }
    | { accepted: false; reason: "unregistered_device"; detail: string };

export function checkDevice(device_id: string): DeviceDecision {
    if (!DEVICE_REGISTRY_ENABLED) {
        return { accepted: true, reason: "guard_disabled" };
    }
    if (REGISTERED_DEVICES.has(device_id)) {
        return { accepted: true, reason: "registered" };
    }
    return {
        accepted: false,
        reason: "unregistered_device",
        detail: `device_id='${device_id}' is not in the registered devices allow-list.`,
    };
}

export function registeredDeviceList(): string[] {
    return Array.from(REGISTERED_DEVICES).sort();
}
