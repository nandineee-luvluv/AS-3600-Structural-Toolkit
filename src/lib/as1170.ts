/**
 * AS 1170: Structural Design Actions Library
 */

export interface LoadFactors {
  G: number;  // Permanent (Dead)
  Q: number;  // Imposed (Live)
  W: number;  // Wind
  E: number;  // Earthquake
  Sn?: number; // Snow
  R?: number;  // Rain/Liquid
}

export interface LoadCombination {
  id: string;
  label: string;
  factors: LoadFactors;
  type: 'ULS' | 'SLS' | 'USER';
  description?: string;
}

/**
 * AS 1170.0: General Principles
 * Table 4.2.2: Strength Limit States (ULS)
 */
export const AS1170_ULS_COMBINATIONS: LoadCombination[] = [
  { id: '1.35G', label: '1.35G', factors: { G: 1.35, Q: 0, W: 0, E: 0 }, type: 'ULS', description: 'Permanent action only' },
  { id: '1.2G_1.5Q', label: '1.2G + 1.5Q', factors: { G: 1.2, Q: 1.5, W: 0, E: 0 }, type: 'ULS', description: 'Permanent and imposed actions' },
  { id: '1.2G_Wu_0.4Q', label: '1.2G + Wu + 0.4Q', factors: { G: 1.2, Q: 0.4, W: 1.0, E: 0 }, type: 'ULS', description: 'Permanent, wind and imposed actions' },
  { id: '0.9G_Wu', label: '0.9G + Wu', factors: { G: 0.9, Q: 0, W: 1.0, E: 0 }, type: 'ULS', description: 'Permanent and wind (uplift/reversal)' },
  { id: 'G_Eu_0.4Q', label: 'G + Eu + 0.4Q', factors: { G: 1.0, Q: 0.4, W: 0, E: 1.0 }, type: 'ULS', description: 'Permanent, earthquake and imposed actions' },
  { id: '0.9G_Eu', label: '0.9G + Eu', factors: { G: 0.9, Q: 0, W: 0, E: 1.0 }, type: 'ULS', description: 'Permanent and earthquake (uplift/reversal)' },
];

/**
 * AS 1170.0: General Principles
 * Table 4.3: Serviceability Limit States (SLS)
 */
export const AS1170_SLS_COMBINATIONS: LoadCombination[] = [
  { id: 'G_Q', label: 'G + Q', factors: { G: 1.0, Q: 1.0, W: 0, E: 0 }, type: 'SLS', description: 'Short-term serviceability' },
  { id: 'G_0.7Q', label: 'G + 0.7Q', factors: { G: 1.0, Q: 0.7, W: 0, E: 0 }, type: 'SLS', description: 'Long-term serviceability (typical)' },
  { id: 'G_0.4Q', label: 'G + 0.4Q', factors: { G: 1.0, Q: 0.4, W: 0, E: 0 }, type: 'SLS', description: 'Long-term serviceability (minimum)' },
  { id: 'G_0.7Ws', label: 'G + 0.7Ws', factors: { G: 1.0, Q: 0, W: 0.7, E: 0 }, type: 'SLS', description: 'Serviceability wind' },
];

/**
 * AS 1170.1: Permanent and Imposed Actions
 * Table 3.1: Imposed Actions for Floors
 */
export const IMPOSED_ACTIONS = [
  { category: 'Residential', q: 1.5, Q: 1.8, description: 'Houses, apartments' },
  { category: 'Offices', q: 3.0, Q: 2.7, description: 'General office space' },
  { category: 'Retail', q: 4.0, Q: 4.5, description: 'Shops, showrooms' },
  { category: 'Storage', q: 5.0, Q: 7.0, description: 'Light storage' },
  { category: 'Parking', q: 2.5, Q: 13.0, description: 'Passenger cars < 2500kg' },
  { category: 'Assembly', q: 5.0, Q: 4.5, description: 'Fixed seating, stages' },
];

/**
 * AS 1170.2: Wind Actions (Simplified)
 */
export const WIND_REGIONS = [
  { region: 'A', Vr: 45, description: 'Normal (Non-cyclonic)' },
  { region: 'B', Vr: 57, description: 'Intermediate' },
  { region: 'C', Vr: 66, description: 'Cyclonic' },
  { region: 'D', Vr: 80, description: 'Severe Cyclonic' },
];

/**
 * AS 1170.4: Earthquake Actions (Simplified)
 */
export const HAZARD_FACTORS = [
  { city: 'Adelaide', Z: 0.10 },
  { city: 'Brisbane', Z: 0.05 },
  { city: 'Canberra', Z: 0.08 },
  { city: 'Melbourne', Z: 0.08 },
  { city: 'Perth', Z: 0.09 },
  { city: 'Sydney', Z: 0.08 },
];

export function calculateFactoredLoad(loads: LoadFactors, factors: LoadFactors): number {
  return (
    (loads.G * factors.G) +
    (loads.Q * factors.Q) +
    (loads.W * factors.W) +
    (loads.E * factors.E) +
    ((loads.Sn || 0) * (factors.Sn || 0)) +
    ((loads.R || 0) * (factors.R || 0))
  );
}
