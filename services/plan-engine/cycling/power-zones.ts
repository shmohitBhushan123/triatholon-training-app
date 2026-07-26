// services/plan-engine/cycling/power-zones.ts
// Coggan 7-zone power model. All zone bounds are computed from FTP — no static
// lookup table is needed. Zone percentages and cadence guidance follow the
// canonical Coggan/Allen framework used by Zwift, TrainingPeaks, and Garmin.

export type CogganZone = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface ZoneConfig {
  zone: CogganZone;
  name: string;
  minPct: number; // lower bound as % of FTP (inclusive)
  maxPct: number | null; // upper bound as % of FTP; null = unbounded
  cadenceRpm: number; // lower end of recommended cadence range
  cadenceMaxRpm: number | null; // upper end; null = single-value target
}

// Canonical Coggan zone definitions.
// Cadence ranges follow standard triathlon coaching: aerobic zones favour
// higher cadence (pedalling efficiency); neuromuscular zones are cadence-agnostic.
const ZONE_CONFIGS: ZoneConfig[] = [
  { zone: 1, name: 'Active Recovery', minPct: 0, maxPct: 55, cadenceRpm: 80, cadenceMaxRpm: 90 },
  { zone: 2, name: 'Endurance', minPct: 56, maxPct: 75, cadenceRpm: 85, cadenceMaxRpm: 95 },
  { zone: 3, name: 'Tempo', minPct: 76, maxPct: 90, cadenceRpm: 85, cadenceMaxRpm: 95 },
  { zone: 4, name: 'Threshold', minPct: 91, maxPct: 105, cadenceRpm: 85, cadenceMaxRpm: 95 },
  { zone: 5, name: 'VO2max', minPct: 106, maxPct: 120, cadenceRpm: 90, cadenceMaxRpm: 100 },
  { zone: 6, name: 'Anaerobic', minPct: 121, maxPct: 150, cadenceRpm: 95, cadenceMaxRpm: null },
  {
    zone: 7,
    name: 'Neuromuscular',
    minPct: 151,
    maxPct: null,
    cadenceRpm: 100,
    cadenceMaxRpm: null,
  },
];

// Sweet spot (88–93% FTP) sits between Z3 and Z4. It is not an official Coggan
// zone but is widely used in triathlon coaching for time-efficient FTP development.
export const SWEET_SPOT_CONFIG = {
  name: 'Sweet Spot',
  minPct: 88,
  maxPct: 93,
  cadenceRpm: 85,
  cadenceMaxRpm: 95,
} as const;

export interface ZoneBounds {
  zone: CogganZone;
  name: string;
  minWatts: number;
  maxWatts: number | null; // null for Zone 7 (unbounded ceiling)
  midWatts: number;
  cadenceRpm: number;
  cadenceMaxRpm: number | null;
}

export interface SweetSpotBounds {
  name: string;
  minWatts: number;
  maxWatts: number;
  midWatts: number;
  cadenceRpm: number;
  cadenceMaxRpm: number;
}

export function getZoneBounds(ftpWatts: number, zone: CogganZone): ZoneBounds {
  const config = ZONE_CONFIGS.find((z) => z.zone === zone);
  if (!config) throw new Error(`Unknown Coggan zone: ${zone}`);

  const minWatts = Math.round((config.minPct / 100) * ftpWatts);
  const maxWatts = config.maxPct !== null ? Math.round((config.maxPct / 100) * ftpWatts) : null;
  const midPct = config.maxPct !== null ? (config.minPct + config.maxPct) / 2 : config.minPct;
  const midWatts = Math.round((midPct / 100) * ftpWatts);

  return {
    zone,
    name: config.name,
    minWatts,
    maxWatts,
    midWatts,
    cadenceRpm: config.cadenceRpm,
    cadenceMaxRpm: config.cadenceMaxRpm,
  };
}

export function getSweetSpotBounds(ftpWatts: number): SweetSpotBounds {
  const { minPct, maxPct, cadenceRpm, cadenceMaxRpm } = SWEET_SPOT_CONFIG;
  const minWatts = Math.round((minPct / 100) * ftpWatts);
  const maxWatts = Math.round((maxPct / 100) * ftpWatts);
  const midWatts = Math.round(((minPct + maxPct) / 2 / 100) * ftpWatts);
  return { name: SWEET_SPOT_CONFIG.name, minWatts, maxWatts, midWatts, cadenceRpm, cadenceMaxRpm };
}
