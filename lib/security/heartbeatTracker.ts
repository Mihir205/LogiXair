/**
 * LoRa link-loss / jamming watchdog (Cyberattack #10).
 *
 * Threat: an attacker keys up a continuous-wave or chirp jammer on the
 * deployment SF/BW/frequency. Every sensor in range goes silent. Without
 * a watchdog, the backend doesn't notice — dashboards happily keep
 * showing the LAST reading as if everything is fine. Operations team
 * thinks the field is calm while crops actually flood.
 *
 * Defense: track per-device "last seen" timestamps in memory. The
 * Sentinel polls every 30s; any device whose last heartbeat is older
 * than STALE_THRESHOLD_SEC is flagged as `possible_jamming`. On the
 * first detection per device we also write a single security_events
 * entry so the Live Alerts feed picks it up (no re-firing every poll).
 *
 * NO Firestore writes from the ingest path — heartbeats are kept in a
 * module-level Map, so legit traffic costs zero quota. Only the
 * transition to "stale" writes one audit record.
 */

// FLIP FOR BEFORE/AFTER JAMMING screenshots.
export const JAMMING_DETECTION_ENABLED = true;

// Mark a device as stale (possibly jammed) after this many seconds of
// silence. Short for the demo; tune to 2x expected reporting interval
// for production.
export const STALE_THRESHOLD_SEC = 30;

const _heartbeats = new Map<string, number>();   // device_id -> unix-sec
const _alertedStale = new Set<string>();         // already-reported stale devices

export function recordHeartbeat(device_id: string): void {
    if (!device_id) return;
    _heartbeats.set(device_id, Math.floor(Date.now() / 1000));
    // If this device was previously stale and is now back, clear the alert
    // flag so a future outage gets reported again.
    _alertedStale.delete(device_id);
}

export interface StaleDeviceHit {
    device_id: string;
    silent_for_sec: number;
    last_seen_iso: string;
    first_detection: boolean;
}

/**
 * Returns currently-stale devices. `first_detection` flips true the
 * first time a given device crosses the threshold; subsequent polls
 * return it as false (so the Sentinel knows not to log a duplicate
 * security_events entry).
 */
export function listStaleDevices(): StaleDeviceHit[] {
    if (!JAMMING_DETECTION_ENABLED) return [];
    const now = Math.floor(Date.now() / 1000);
    const out: StaleDeviceHit[] = [];
    for (const [device_id, lastSeen] of _heartbeats) {
        const silent = now - lastSeen;
        if (silent < STALE_THRESHOLD_SEC) continue;
        const first = !_alertedStale.has(device_id);
        if (first) _alertedStale.add(device_id);
        out.push({
            device_id,
            silent_for_sec: silent,
            last_seen_iso: new Date(lastSeen * 1000).toISOString(),
            first_detection: first,
        });
    }
    return out;
}

export function trackerStats() {
    return {
        tracked_devices: _heartbeats.size,
        alerted_stale: _alertedStale.size,
        stale_threshold_sec: STALE_THRESHOLD_SEC,
        guard_enabled: JAMMING_DETECTION_ENABLED,
    };
}
