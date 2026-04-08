/**
 * AS 3600:2018 Concrete Structures Calculation Library
 */

export const CONCRETE_GRADES = [20, 25, 32, 40, 50, 65, 80, 100];
export const STEEL_GRADES = [250, 500];

export const LOAD_COMBINATIONS = [
  { id: '1.35G', label: '1.35G', factors: { G: 1.35, Q: 0, W: 0, E: 0 } },
  { id: '1.2G_1.5Q', label: '1.2G + 1.5Q', factors: { G: 1.2, Q: 1.5, W: 0, E: 0 } },
  { id: '1.2G_Wu_0.4Q', label: '1.2G + Wu + 0.4Q', factors: { G: 1.2, Q: 0.4, W: 1.0, E: 0 } },
  { id: '0.9G_Wu', label: '0.9G + Wu (Uplift)', factors: { G: 0.9, Q: 0, W: 1.0, E: 0 } },
  { id: 'G_Eu_0.4Q', label: 'G + Eu + 0.4Q (Seismic)', factors: { G: 1.0, Q: 0.4, W: 0, E: 1.0 } },
  { id: '1.2G_0.6Q_Wu', label: '1.2G + 0.6Q + Wu', factors: { G: 1.2, Q: 0.6, W: 1.0, E: 0 } },
  { id: '1.2G_Q_0.5Wu', label: '1.2G + Q + 0.5Wu', factors: { G: 1.2, Q: 1.0, W: 0.5, E: 0 } },
  { id: '1.2G_0.6Q_Eu', label: '1.2G + 0.6Q + Eu', factors: { G: 1.2, Q: 0.6, W: 0, E: 1.0 } },
];

export const SECTION_LIBRARY = {
  beams: [
    { id: 'b300x600', label: '300x600 Rect', b: 300, h: 600 },
    { id: 'b400x800', label: '400x800 Rect', b: 400, h: 800 },
    { id: 'b500x1000', label: '500x1000 Rect', b: 500, h: 1000 },
    { id: 'b250x500', label: '250x500 Rect', b: 250, h: 500 },
  ],
  columns: [
    { id: 'c400x400', label: '400x400 Square', b: 400, h: 400 },
    { id: 'c500x500', label: '500x500 Square', b: 500, h: 500 },
    { id: 'c600x600', label: '600x600 Square', b: 600, h: 600 },
    { id: 'c300x600', label: '300x600 Rect', b: 300, h: 600 },
    { id: 'c400x800', label: '400x800 Rect', b: 400, h: 800 },
  ],
  walls: [
    { id: 'w200x2000', label: '200x2000 Wall', tw: 200, Lw: 2000 },
    { id: 'w250x3000', label: '250x3000 Wall', tw: 250, Lw: 3000 },
    { id: 'w300x4000', label: '300x4000 Wall', tw: 300, Lw: 4000 },
    { id: 'w200x1500', label: '200x1500 Wall', tw: 200, Lw: 1500 },
  ]
};

export const BEAM_END_CONDITIONS = [
  { id: 'simply-supported', label: 'Simply Supported', k_moment: 0.125, k_shear: 0.5 },
  { id: 'fixed-fixed', label: 'Fixed-Fixed', k_moment: 0.0833, k_shear: 0.5 }, // Max moment at support
  { id: 'propped-cantilever', label: 'Propped Cantilever', k_moment: 0.125, k_shear: 0.625 },
  { id: 'cantilever', label: 'Cantilever', k_moment: 0.5, k_shear: 1.0 },
];

export const COLUMN_END_CONDITIONS = [
  { id: 'fixed-fixed', label: 'Fixed-Fixed', k_eff: 0.7 },
  { id: 'fixed-pinned', label: 'Fixed-Pinned', k_eff: 0.85 },
  { id: 'pinned-pinned', label: 'Pinned-Pinned', k_eff: 1.0 },
  { id: 'fixed-free', label: 'Fixed-Free (Cantilever)', k_eff: 2.1 },
];

export interface MaterialProperties {
  fc: number; // MPa
  fsy: number; // MPa
  Es: number; // MPa (default 200,000)
  Ec?: number; // MPa
}

export function getConcreteEc(fc: number): number {
  // Clause 3.1.2: Modulus of elasticity of concrete
  if (fc <= 40) {
    return Math.pow(2400, 1.5) * 0.043 * Math.sqrt(fc);
  }
  return (Math.pow(2400, 1.5) * 0.043 * Math.sqrt(fc)) * (0.6 + fc / 100);
}

export interface BeamSection {
  b: number; // mm
  d: number; // mm (effective depth)
  h: number; // mm (total height)
  Ast: number; // mm2 (tensile reinforcement)
  Asc?: number; // mm2 (compressive reinforcement)
  dc?: number; // mm (depth to compression steel)
}

export interface DesignLoads {
  M_star: number; // kNm (factored moment)
  V_star: number; // kN (factored shear)
  N_star?: number; // kN (factored axial load)
}

/**
 * Clause 8.1: Design of beams for strength in bending
 */
export function calculateFlexuralCapacity(
  section: BeamSection,
  materials: MaterialProperties,
  phi: number = 0.85
): {
  phiMu: number; // kNm
  ku: number; // neutral axis parameter
  isDuctile: boolean;
  isDoublyReinforced: boolean;
} {
  const { fc, fsy } = materials;
  const { b, d, Ast, Asc = 0, dc = 50 } = section;

  const alpha2 = Math.max(0.67, 0.85 - 0.0015 * fc);
  const gamma = Math.max(0.67, 0.97 - 0.0025 * fc);

  let ku: number;
  let Mu: number;
  let isDoubly = false;

  if (Asc > 0) {
    // Doubly reinforced section
    isDoubly = true;
    // T = C_concrete + C_steel
    // Ast * fsy = alpha2 * fc * b * (gamma * d_na) + Asc * fsy
    const d_na = (Ast - Asc) * fsy / (alpha2 * fc * b * gamma);
    ku = d_na / d;
    Mu = (alpha2 * fc * b * gamma * d_na * (d - gamma * d_na / 2) + Asc * fsy * (d - dc)) * 1e-6;
  } else {
    // Singly reinforced
    ku = (Ast * fsy) / (alpha2 * fc * b * gamma * d);
    Mu = Ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6;
  }

  return {
    phiMu: phi * Mu,
    ku,
    isDuctile: ku <= 0.36,
    isDoublyReinforced: isDoubly
  };
}

/**
 * Required Reinforcement for Beam
 */
export function calculateRequiredBeamReinforcement(
  b: number,
  d: number,
  M_star: number,
  materials: MaterialProperties,
  phi: number = 0.85
): {
  Ast_req: number;
  Asc_req: number;
  isDoublyRequired: boolean;
} {
  const { fc, fsy } = materials;
  const alpha2 = Math.max(0.67, 0.85 - 0.0015 * fc);
  const gamma = Math.max(0.67, 0.97 - 0.0025 * fc);

  // Max Mu as singly reinforced (ku = 0.36)
  const ku_max = 0.36;
  const Mu_max_singly = alpha2 * fc * b * (gamma * ku_max * d) * (d - (gamma * ku_max * d) / 2) * 1e-6;
  const phiMu_max_singly = phi * Mu_max_singly;

  if (M_star <= phiMu_max_singly) {
    const K = (M_star * 1e6) / (phi * b * d * d * fc);
    const Ast = (fc * b * d / fsy) * (1 - Math.sqrt(1 - (2 * K / alpha2))) * alpha2;
    return { Ast_req: Ast, Asc_req: 0, isDoublyRequired: false };
  } else {
    const M_excess = M_star - phiMu_max_singly;
    const Ast1 = (alpha2 * fc * b * gamma * ku_max * d) / fsy;
    const dc = 50; 
    const Asc = (M_excess * 1e6) / (phi * fsy * (d - dc));
    const Ast2 = Asc;
    return { Ast_req: Ast1 + Ast2, Asc_req: Asc, isDoublyRequired: true };
  }
}

/**
 * Clause 8.2: Design of beams for strength in shear
 */
export function calculateShearCapacity(
  section: BeamSection,
  materials: MaterialProperties,
  Asv: number,
  s: number,
  phi: number = 0.75
): {
  phiVu: number;
  Vuc: number;
  Vus: number;
} {
  const { fc, fsy } = materials;
  const { b, d } = section;

  const dv = Math.max(0.72 * section.h, 0.9 * d);
  const kv = 0.15; 
  const Vuc = kv * b * dv * Math.sqrt(fc) * 1e-3;

  const theta = 36 * (Math.PI / 180);
  const Vus = (Asv * fsy * dv * (1 / Math.tan(theta))) / s * 1e-3;

  const Vu = Vuc + Vus;

  return {
    phiVu: phi * Vu,
    Vuc,
    Vus,
  };
}

/**
 * Column Design (Clause 10)
 */
export function calculateColumnBiaxial(
  b: number,
  h: number,
  Ast: number,
  materials: MaterialProperties,
  N_star: number,
  Mx_star: number,
  My_star: number
): {
  isSafe: boolean;
  phiNu: number;
  ratio: number;
} {
  const { fc, fsy } = materials;
  const Ag = b * h;
  const alpha1 = 1.0 - 0.003 * fc;
  const Nuo = (alpha1 * fc * (Ag - Ast) + fsy * Ast) * 1e-3;
  const phiNu_max = 0.6 * 0.8 * Nuo;

  const d = Math.min(b, h) - 50;
  const { phiMu: phiMux } = calculateFlexuralCapacity({ b, d: h - 50, h, Ast: Ast / 4 }, materials, 0.65);
  const { phiMu: phiMuy } = calculateFlexuralCapacity({ b: h, d: b - 50, h: b, Ast: Ast / 4 }, materials, 0.65);

  const ratio = (N_star / phiNu_max) + (Mx_star / phiMux) + (My_star / phiMuy);
  
  return {
    isSafe: ratio <= 1.0,
    phiNu: phiNu_max,
    ratio
  };
}

/**
 * Slab Deflection Check (Clause 9.4)
 */
export function checkSlabDeflection(
  L: number,
  d: number,
  isContinuous: boolean = false
): {
  isSafe: boolean;
  ratio: number;
  limit: number;
} {
  const k1 = isContinuous ? 1.2 : 1.0;
  const limit = 30 * k1; 
  const ratio = L / d;
  return {
    isSafe: ratio <= limit,
    ratio,
    limit
  };
}

/**
 * Punching Shear (Clause 9.2)
 */
export function calculatePunchingShear(
  h: number,
  d: number,
  fc: number,
  u: number, 
  V_star: number,
  phi: number = 0.7
): {
  phiVuo: number;
  isSafe: boolean;
} {
  const fcv = 0.17 * (1 + 2 / 1.0) * Math.sqrt(fc); 
  const Vuo = fcv * u * d * 1e-3;
  return {
    phiVuo: phi * Vuo,
    isSafe: V_star <= phi * Vuo
  };
}

/**
 * Wall Boundary Elements (Clause 14.6.2)
 */
export function calculateWallBoundaryElements(
  tw: number,
  Lw: number,
  Hw: number,
  N_star: number,
  M_star: number,
  materials: MaterialProperties
) {
  const { fc } = materials;
  const Ag = tw * Lw;
  const stress = (N_star * 1e3 / Ag) + (M_star * 1e6 / (tw * Lw * Lw / 6));
  const needsBoundary = stress > 0.15 * fc;
  
  return {
    stress,
    needsBoundary,
    boundaryLength: needsBoundary ? Math.max(0.15 * Lw, tw) : 0,
    clause: '14.6.2.1'
  };
}

/**
 * Seismic Detailing (Section 14)
 */
export interface SeismicRequirement {
  clause: string;
  requirement: string;
  value: string;
  status: 'pass' | 'fail' | 'info';
  description: string;
}

export function calculateSeismicDetailing(
  type: 'beam' | 'column' | 'wall',
  params: {
    b: number;
    h: number;
    d: number;
    db: number; // bar diam
    ds: number; // stirrup diam
    s: number;  // spacing
    fc: number;
  }
): SeismicRequirement[] {
  const requirements: SeismicRequirement[] = [];

  if (type === 'beam') {
    // Clause 14.4.4 - Confinement
    const s_max = Math.min(params.d / 4, 8 * params.db, 24 * params.ds, 300);
    requirements.push({
      clause: '14.4.4.2',
      requirement: 'Max Stirrup Spacing (Plastic Hinge)',
      value: `${s_max.toFixed(0)} mm`,
      status: params.s <= s_max ? 'pass' : 'fail',
      description: 'Confinement spacing to ensure ductility in plastic hinges.'
    });
  }

  if (type === 'column') {
    // Clause 14.5.4 - Confinement
    const s_max = Math.min(params.b / 4, params.h / 4, 6 * params.db, 150);
    requirements.push({
      clause: '14.5.4.3',
      requirement: 'Max Tie Spacing (Plastic Hinge)',
      value: `${s_max.toFixed(0)} mm`,
      status: params.s <= s_max ? 'pass' : 'fail',
      description: 'Confinement ties to prevent longitudinal bar buckling.'
    });
  }

  if (type === 'wall') {
    // Clause 14.6.4 - Horizontal reinforcement
    const rho_h_min = 0.0025;
    requirements.push({
      clause: '14.6.4.1',
      requirement: 'Min Horizontal Reinforcement Ratio',
      value: `${(rho_h_min * 100).toFixed(2)}%`,
      status: 'info',
      description: 'Minimum horizontal reinforcement for seismic shear resistance.'
    });
  }

  return requirements;
}

/**
 * Generates points for a column interaction diagram (φNu vs φMu)
 */
export function generateColumnInteractionDiagram(
  b: number,
  h: number,
  Ast: number,
  materials: MaterialProperties,
  phi: number = 0.65
): { x: number; y: number }[] {
  const { fc, fsy } = materials;
  const Ag = b * h;
  const alpha1 = 1.0 - 0.003 * fc;
  const alpha2 = Math.max(0.67, 0.85 - 0.0015 * fc);
  const gamma = Math.max(0.67, 0.97 - 0.0025 * fc);
  const d = h - 50; // Effective depth estimate
  const dc = 50;   // Compression steel depth estimate

  const points: { x: number; y: number }[] = [];

  // 1. Pure Axial Compression (Nuo)
  const Nuo = (alpha1 * fc * (Ag - Ast) + fsy * Ast) * 1e-3;
  const phiNu_max = 0.8 * Nuo * phi; // Clause 10.3.2
  points.push({ x: 0, y: phiNu_max });

  // 2. Decompression (Neutral axis at extreme fiber)
  // 3. Balanced Point (Steel at yield, concrete at 0.003 strain)
  // 4. Pure Bending (N = 0)
  // 5. Pure Tension (N = -Ast * fsy)

  // Simplified approach: Calculate points at different neutral axis depths
  const n_steps = 10;
  for (let i = 0; i <= n_steps; i++) {
    const dn = (h * 1.5) * (1 - i / n_steps); // Neutral axis depth from above h to 0
    if (dn < 0.01) {
      // Pure Bending approx
      const { phiMu } = calculateFlexuralCapacity({ b, d, h, Ast: Ast / 2, Asc: Ast / 2, dc }, materials, phi);
      points.push({ x: phiMu, y: 0 });
      continue;
    }

    const ku = dn / d;
    const Cc = alpha2 * fc * b * Math.min(gamma * dn, h) * 1e-3;
    const Ts = (Ast / 2) * fsy * 1e-3; // Simplified: half steel in tension, half in compression
    const Cs = (Ast / 2) * fsy * 1e-3;

    // This is a VERY simplified model for the diagram shape
    // Real calculation requires strain compatibility at each bar layer
    const Nu = Cc + Cs - Ts;
    const Mu = (Cc * (h / 2 - Math.min(gamma * dn, h) / 2) + Cs * (h / 2 - dc) + Ts * (d - h / 2)) * 1e-6;

    if (phi * Nu <= phiNu_max) {
      points.push({ x: phi * Mu, y: phi * Nu });
    }
  }

  // Ensure it ends at pure bending
  const { phiMu: pureM } = calculateFlexuralCapacity({ b, d, h, Ast: Ast / 2, Asc: Ast / 2, dc }, materials, phi);
  points.push({ x: pureM, y: 0 });

  // Sort by Y descending to ensure a proper curve
  return points.sort((a, b) => b.y - a.y);
}

/**
 * Generates points for a wall interaction diagram
 */
export function generateWallInteractionDiagram(
  tw: number,
  Lw: number,
  Ast: number,
  materials: MaterialProperties,
  phi: number = 0.65
): { x: number; y: number }[] {
  // Walls are essentially large columns
  return generateColumnInteractionDiagram(tw, Lw, Ast, materials, phi);
}

/**
 * Input Validation Utility
 */
export function validateInput(val: number, min: number, max: number, label: string): string | null {
  if (isNaN(val)) return `${label} must be a number`;
  if (val < min) return `${label} must be at least ${min}`;
  if (val > max) return `${label} must not exceed ${max}`;
  return null;
}
