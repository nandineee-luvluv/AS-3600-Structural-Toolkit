/**
 * AS 3600:2018 Concrete Structures Calculation Library
 */

export const CONCRETE_GRADES = [20, 25, 32, 40, 50, 65, 80, 100];
export const STEEL_GRADES = [250, 500, 600, 1750, 1860];

export const REINFORCEMENT_TYPES = [
  { id: '250N', label: 'Grade 250N (Mild Steel)', fsy: 250, type: 'rebar' },
  { id: '500N', label: 'Grade 500N (Standard Rebar)', fsy: 500, type: 'rebar' },
  { id: '500L', label: 'Grade 500L (Low Ductility)', fsy: 500, type: 'rebar' },
  { id: 'SS500', label: 'Stainless Steel Grade 500', fsy: 500, type: 'alloy' },
  { id: 'SS600', label: 'Stainless Steel Grade 600', fsy: 600, type: 'alloy' },
  { id: 'C1750', label: 'Prestressing Cable 1750', fsy: 1750, type: 'cable' },
  { id: 'C1860', label: 'Prestressing Cable 1860', fsy: 1860, type: 'cable' },
];

export const LOAD_COMBINATIONS = [
  { id: '1.35G', label: '1.35G', factors: { G: 1.35, Q: 0, W: 0, E: 0 } },
  { id: '1.2G_1.5Q', label: '1.2G + 1.5Q', factors: { G: 1.2, Q: 1.5, W: 0, E: 0 } },
  { id: '1.2G_Wu_0.4Q', label: '1.2G + Wu + 0.4Q', factors: { G: 1.2, Q: 0.4, W: 1.0, E: 0 } },
  { id: '0.9G_Wu', label: '0.9G + Wu (Uplift)', factors: { G: 0.9, Q: 0, W: 1.0, E: 0 } },
  { id: 'G_Eu_0.4Q', label: 'G + Eu + 0.4Q (Seismic)', factors: { G: 1.0, Q: 0.4, W: 0, E: 1.0 } },
  { id: '1.2G_0.6Q_Wu', label: '1.2G + 0.6Q + Wu', factors: { G: 1.2, Q: 0.6, W: 1.0, E: 0 } },
  { id: '1.2G_Q_0.5Wu', label: '1.2G + Q + 0.5Wu', factors: { G: 1.2, Q: 1.0, W: 0.5, E: 0 } },
  { id: '1.2G_0.6Q_Eu', label: '1.2G + 0.6Q + Eu', factors: { G: 1.2, Q: 0.6, W: 0, E: 1.0 } },
  { id: '0.9G_Eu', label: '0.9G + Eu (Seismic Uplift)', factors: { G: 0.9, Q: 0, W: 0, E: 1.0 } },
  { id: 'G_Q', label: 'G + Q (Serviceability)', factors: { G: 1.0, Q: 1.0, W: 0, E: 0 } },
  { id: 'G_0.7Q', label: 'G + 0.7Q (Long Term)', factors: { G: 1.0, Q: 0.7, W: 0, E: 0 } },
];

export const SECTION_LIBRARY = {
  beams: [
    { id: 'b_rect_300x600', label: '300x600 Rectangular', shape: 'rectangular', b: 300, h: 600, L: 6000, cover: 40 },
    { id: 'b_t_600x600', label: 'T-Beam (600f/200s)', shape: 't-beam', bf: 600, tf: 150, tw: 200, h: 600, L: 6000, cover: 40 },
    { id: 'b_l_500x500', label: 'L-Beam (500f/200s)', shape: 'l-beam', bf: 500, tf: 150, tw: 200, h: 500, L: 6000, cover: 40 },
    { id: 'b_trap_400_200_600', label: 'Trapezoidal 400/200', shape: 'trapezoidal', b_top: 400, b_bottom: 200, h: 600, L: 6000, cover: 40 },
  ],
  columns: [
    { id: 'c_rect_400x400', label: '400x400 Rectangular', shape: 'rectangular', b: 400, h: 400, L: 4000, cover: 40 },
    { id: 'c_t_600x600', label: 'T-Column 600x600', shape: 't-shaped', bf: 600, tf: 200, tw: 200, hw: 400, L: 4000, cover: 40 },
    { id: 'c_l_600x600', label: 'L-Column 600x600', shape: 'l-shaped', l1: 600, t1: 200, l2: 400, t2: 200, L: 4000, cover: 40 },
    { id: 'c_i_400x700', label: 'I-Column 400x700', shape: 'i-shaped', bf_top: 400, tf_top: 150, bf_bot: 400, tf_bot: 150, tw: 150, hw: 400, L: 4000, cover: 40 },
  ],
  walls: [
    { id: 'w_lin_200x3000', label: '200x3000 Linear', shape: 'linear', tw: 200, Lw: 3000, Hw: 3000 },
    { id: 'w_t_1500x1000', label: 'T-Wall 1500x1000', shape: 't-shaped', bf: 1500, tf: 250, tw: 250, hw: 750, Hw: 3000 },
    { id: 'w_l_1200x1200', label: 'L-Wall 1200x1200', shape: 'l-shaped', l1: 1200, t1: 250, l2: 950, t2: 250, Hw: 3000 },
    { id: 'w_c_2000x1200', label: 'C-Wall 2000x1200', shape: 'c-shaped', bf: 1200, tf: 250, tw: 2000, hw: 950, Hw: 3000 },
    { id: 'w_i_1000x2000', label: 'I-Wall 1000x2000', shape: 'i-shaped', bf_top: 1000, tf_top: 250, bf_bot: 1000, tf_bot: 250, tw: 250, hw: 1500, Hw: 3000 },
  ],
  slabs: [
    { id: 's_one_200', label: '200mm One-Way', shape: 'one-way', h: 200, Lx: 4000, Ly: 6000, cover: 25 },
    { id: 's_two_250', label: '250mm Two-Way', shape: 'two-way', h: 250, Lx: 6000, Ly: 8000, cover: 25 },
    { id: 's_waf_300', label: '300mm Waffle', shape: 'waffle', h: 300, Lx: 8000, Ly: 8000, cover: 25, ribSpacing: 600, ribWidth: 150, toppingThickness: 75 },
    { id: 's_foot_600', label: '600mm Footing', shape: 'footing', h: 600, Lx: 2000, Ly: 2000, cover: 50 },
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
  isCustom?: boolean;
  label?: string;
}

export function getConcreteEc(fc: number): number {
  // Clause 3.1.2: Modulus of elasticity of concrete
  // Assuming normal density concrete (rho = 2400 kg/m3)
  if (fc <= 40) {
    return Math.pow(2400, 1.5) * 0.043 * Math.sqrt(fc);
  }
  // For fc > 40 MPa
  return (Math.pow(2400, 1.5) * 0.043 * Math.sqrt(fc)) * (0.6 + fc / 100);
}

/**
 * Clause 2.2.2: Capacity reduction factors (phi)
 */
export function getPhiBending(ku: number, isLowDuctility: boolean = false): number {
  if (isLowDuctility) return 0.6; // Grade 500L
  if (ku <= 0.36) return 0.85;
  // AS 3600:2018 Table 2.2.2 (a) - Note: ku is limited to 0.36 for ductility in most cases
  // but for non-ductile failure or high ku, phi reduces.
  return Math.max(0.65, 0.85 - (0.85 - 0.65) * (ku - 0.36) / (0.6 - 0.36));
}

export type SectionShape = 
  | 'rectangular' 
  | 't-beam' 
  | 'l-beam' 
  | 'trapezoidal' 
  | 't-shaped' 
  | 'l-shaped' 
  | 'i-shaped' 
  | 'c-shaped' 
  | 'linear';

export interface BeamSection {
  shape?: SectionShape;
  h: number; // total height
  b?: number; // width for rectangular
  bf?: number; // flange width
  tf?: number; // flange thickness
  tw?: number; // web thickness
  b_top?: number; // trapezoidal top
  b_bottom?: number; // trapezoidal bottom
  d: number; // effective depth
  Ast: number; // tensile reinforcement
  Asc?: number; // compressive reinforcement
  dc?: number; // depth to compression steel
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
  phiOverride?: number
): {
  phiMu: number; // kNm
  ku: number; // neutral axis parameter
  isDuctile: boolean;
  isDoublyReinforced: boolean;
  phi: number;
} {
  const { fc, fsy } = materials;
  const { shape, h, d, Ast, Asc = 0, dc = 50 } = section;

  // Clause 8.1.3: Rectangular stress block parameters
  const alpha2 = Math.min(0.85, Math.max(0.67, 0.85 - 0.0015 * fc));
  const gamma = Math.min(0.97, Math.max(0.67, 0.97 - 0.0025 * fc));

  let ku: number;
  let Mu: number;
  let isDoubly = false;

  // Determine effective width b
  let b_eff = section.b || 300;
  if (shape === 't-beam' || shape === 'l-beam') {
    b_eff = section.bf || b_eff;
  } else if (shape === 'trapezoidal') {
    b_eff = ((section.b_top || 300) + (section.b_bottom || 300)) / 2;
  }

  if (Asc > 0) {
    // Doubly reinforced section - Simplified strain compatibility
    isDoubly = true;
    // Assume compression steel yields (fsy) - should check strain in real design
    const d_na = (Ast - Asc) * fsy / (alpha2 * fc * b_eff * gamma);
    ku = d_na / d;
    Mu = (alpha2 * fc * b_eff * gamma * d_na * (d - gamma * d_na / 2) + Asc * fsy * (d - dc)) * 1e-6;
  } else {
    // Singly reinforced
    if (shape === 't-beam' || shape === 'l-beam') {
      const tf = section.tf || 150;
      const tw = section.tw || 200;
      const bf = section.bf || 600;
      
      const d_na_flange = (Ast * fsy) / (alpha2 * fc * bf * gamma);
      if (gamma * d_na_flange <= tf) {
        ku = d_na_flange / d;
        Mu = Ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6;
      } else {
        const C_flange = alpha2 * fc * (bf - tw) * tf;
        const d_na = (Ast * fsy - C_flange) / (alpha2 * fc * tw * gamma);
        ku = d_na / d;
        Mu = (C_flange * (d - tf / 2) + alpha2 * fc * tw * (gamma * d_na) * (d - gamma * d_na / 2)) * 1e-6;
      }
    } else {
      ku = (Ast * fsy) / (alpha2 * fc * b_eff * gamma * d);
      Mu = Ast * fsy * (d - (gamma * ku * d) / 2) * 1e-6;
    }
  }

  const phi = phiOverride || getPhiBending(ku, materials.label?.includes('500L'));

  return {
    phiMu: phi * Mu,
    ku,
    isDuctile: ku <= 0.36,
    isDoublyReinforced: isDoubly,
    phi
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
  kv: number;
  theta: number;
} {
  const { fc, fsy } = materials;
  const b = section.b || section.tw || 300;
  const d = section.d;

  // Clause 8.2.1.9: Effective shear depth
  const dv = Math.max(0.72 * section.h, 0.9 * d);
  
  // Clause 8.2.4: Simplified method for kv and theta
  // Assuming minimum shear reinforcement is provided
  const kv = 0.15; 
  const theta = 36; // degrees
  
  const Vuc = kv * b * dv * Math.sqrt(fc) * 1e-3;

  const thetaRad = theta * (Math.PI / 180);
  const Vus = (Asv * fsy * dv * (1 / Math.tan(thetaRad))) / s * 1e-3;

  // Clause 8.2.3.3: Maximum shear capacity (crushing of web)
  const alpha_v = (0.67 + fc / 200); // Simplified
  const Vu_max = 0.55 * fc * b * dv * (Math.tan(thetaRad) / (1 + Math.pow(Math.tan(thetaRad), 2))) * 1e-3;

  const Vu = Math.min(Vuc + Vus, Vu_max);

  return {
    phiVu: phi * Vu,
    Vuc,
    Vus,
    kv,
    theta
  };
}

/**
 * Clause 8.2.4.2: General method for kv and theta
 */
export function calculateShearGeneralMethod(
  section: BeamSection,
  materials: MaterialProperties,
  loads: DesignLoads,
  Asv: number,
  s: number,
  phi: number = 0.75
): {
  phiVu: number;
  Vuc: number;
  Vus: number;
  kv: number;
  theta: number;
  epsilon_x: number;
} {
  const { fc, fsy, Es = 200000 } = materials;
  const { M_star, V_star, N_star = 0 } = loads;
  const b = section.b || section.tw || 300;
  const d = section.d;
  const Ast = section.Ast;

  const dv = Math.max(0.72 * section.h, 0.9 * d);
  
  // Clause 8.2.4.2.1: Longitudinal strain at mid-depth
  // epsilon_x = (|M*/dv| + V* + 0.5*N*) / (2 * Es * Ast)
  // Limited to 3.0 x 10^-3
  let epsilon_x = (Math.abs(M_star * 1e6 / dv) + Math.abs(V_star * 1e3) + 0.5 * Math.abs(N_star * 1e3)) / (2 * Es * Ast);
  if (epsilon_x > 0.003) epsilon_x = 0.003;
  if (epsilon_x < 0) epsilon_x = 0;

  // Clause 8.2.4.2.2: Determination of kv and theta
  const kv = 0.4 / (1 + 1500 * epsilon_x);
  const theta = 29 + 7000 * epsilon_x;
  const thetaRad = theta * (Math.PI / 180);

  const Vuc = kv * b * dv * Math.sqrt(fc) * 1e-3;
  const Vus = (Asv * fsy * dv * (1 / Math.tan(thetaRad))) / s * 1e-3;

  // Clause 8.2.3.3: Maximum shear capacity
  const Vu_max = 0.55 * fc * b * dv * (Math.tan(thetaRad) / (1 + Math.pow(Math.tan(thetaRad), 2))) * 1e-3;
  const Vu = Math.min(Vuc + Vus, Vu_max);

  return {
    phiVu: phi * Vu,
    Vuc,
    Vus,
    kv,
    theta,
    epsilon_x
  };
}

/**
 * Clause 8.1.6.1: Minimum reinforcement for beams
 */
export function getMinimumReinforcement(b: number, h: number, fc: number, fsy: number): number {
  // Ast,min = 0.2 * (h/d)^2 * f'ct.f / fsy * b * d
  // Simplified as 0.2 * (h/d)^2 * 0.6 * sqrt(fc) / fsy * b * d
  const d = h - 50;
  const fctf = 0.6 * Math.sqrt(fc);
  return 0.2 * Math.pow(h/d, 2) * (fctf / fsy) * b * d;
}

/**
 * Clause 8.6: Crack Control (Deemed to comply)
 */
export function checkCrackControl(
  barDiam: number,
  spacing: number,
  sigma_s: number, // Steel stress under service loads
  exposureId: string
): {
  isSafe: boolean;
  maxSpacing: number;
  maxBarDiam: number;
} {
  // Table 8.6.2.2: Max bar spacing and diameter
  // Simplified logic for standard cases
  let maxSpacing = 300;
  let maxBarDiam = 32;

  if (sigma_s > 200) {
    maxSpacing = 200;
    maxBarDiam = 24;
  }
  if (sigma_s > 300) {
    maxSpacing = 100;
    maxBarDiam = 16;
  }

  return {
    isSafe: spacing <= maxSpacing && barDiam <= maxBarDiam,
    maxSpacing,
    maxBarDiam
  };
}

/**
 * Clause 13.1: Development Length
 */
export function calculateDevelopmentLength(
  db: number,
  fsy: number,
  fc: number,
  isTension: boolean = true
): number {
  // Lsy.t = (0.5 * fsy * db) / (k1 * f'ct)
  // Simplified k1 = 1.3 for top bars, 1.0 otherwise
  const fct = 0.36 * Math.sqrt(fc);
  const k1 = 1.0; 
  return (0.5 * fsy * db) / (k1 * fct);
}
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
  alpha_n: number;
} {
  const { fc, fsy } = materials;
  const Ag = b * h;
  const alpha1 = 1.0 - 0.003 * fc;
  const Nuo = (alpha1 * fc * (Ag - Ast) + fsy * Ast) * 1e-3;
  const phiNu_max = 0.6 * 0.8 * Nuo;

  // Effective depths
  const dx = h - 50;
  const dy = b - 50;

  // Capacity in each axis (simplified as flexural capacity at N_star)
  const { phiMu: phiMux } = calculateFlexuralCapacity({ b, d: dx, h, Ast: Ast / 4 }, materials, 0.65);
  const { phiMu: phiMuy } = calculateFlexuralCapacity({ b: h, d: dy, h: b, Ast: Ast / 4 }, materials, 0.65);

  // Clause 10.6.4: Biaxial bending exponent
  const n_ratio = Math.max(0, N_star / Nuo);
  let alpha_n = 0.7 + 1.7 * n_ratio;
  if (alpha_n < 1.0) alpha_n = 1.0;
  if (alpha_n > 2.0) alpha_n = 2.0;

  const ratio = Math.pow(Math.abs(Mx_star) / phiMux, alpha_n) + Math.pow(Math.abs(My_star) / phiMuy, alpha_n);
  
  return {
    isSafe: ratio <= 1.0 && N_star <= phiNu_max,
    phiNu: phiNu_max,
    ratio,
    alpha_n
  };
}

/**
 * Slab Deflection Check (Clause 9.4.1: Deemed-to-comply span-to-depth ratios)
 */
export function checkSlabDeflection(
  L: number,
  d: number,
  isContinuous: boolean = false,
  isCantilever: boolean = false
): {
  isSafe: boolean;
  ratio: number;
  limit: number;
} {
  // AS 3600 Table 9.4.1
  let k1 = 1.0;
  if (isCantilever) k1 = 0.4;
  else if (isContinuous) k1 = 1.2;
  
  const limit = 30 * k1; 
  const ratio = L / d;
  return {
    isSafe: ratio <= limit,
    ratio,
    limit
  };
}

/**
 * AS 1170.2: Wind Load Utility (Simplified)
 * Calculates design wind pressure p = 0.5 * rho * (V_des)^2 * C_fig * C_dyn
 */
export function calculateWindPressure(data: {
  region: 'A' | 'B' | 'C' | 'D';
  terrainCategory: 1 | 2 | 3 | 4;
  height: number;
  importanceLevel: 1 | 2 | 3 | 4;
}) {
  // Simplified regional wind speeds (V_R) for 500 year ARI
  const regionalSpeeds = { A: 45, B: 57, C: 66, D: 80 };
  const Vr = regionalSpeeds[data.region];
  
  // Simplified Mz,cat factors
  let Mzcat = 0.8;
  if (data.height > 10) Mzcat = 1.0;
  if (data.height > 20) Mzcat = 1.1;
  
  const Vdes = Vr * Mzcat; // Simplified
  const p = 0.6 * Math.pow(Vdes, 2) * 1e-3; // kPa (0.5 * 1.2 * V^2)
  
  return p;
}

/**
 * Two-Way Slab Moment Coefficients (Simplified)
 */
export function calculateTwoWaySlabMoments(
  Lx: number,
  Ly: number,
  qStar: number,
  isContinuous: boolean = false
) {
  const r = Ly / Lx;
  // Simplified coefficients based on aspect ratio
  // These are approximations for demonstration
  const Cx = isContinuous ? 0.035 * Math.pow(r, 0.4) : 0.05 * Math.pow(r, 0.4);
  const Cy = isContinuous ? 0.035 / Math.pow(r, 0.4) : 0.05 / Math.pow(r, 0.4);
  
  return {
    mxStar: Cx * qStar * Math.pow(Lx/1000, 2),
    myStar: Cy * qStar * Math.pow(Lx/1000, 2),
    Cx,
    Cy
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
  beta_h: number = 1.0, // Aspect ratio of column
  phi: number = 0.7
): {
  phiVuo: number;
  isSafe: boolean;
  fcv: number;
} {
  // Clause 9.2.3: Punching shear strength
  const fcv = Math.min(0.17 * (1 + 2 / beta_h), 0.34) * Math.sqrt(fc); 
  const Vuo = fcv * u * d * 1e-3;
  return {
    phiVuo: phi * Vuo,
    isSafe: V_star <= phi * Vuo,
    fcv
  };
}

/**
 * Bearing Pressure for Footings
 */
export function calculateBearingPressure(
  N_star: number,
  Mx_star: number,
  My_star: number,
  B: number,
  L: number
) {
  const A = B * L;
  const Zx = (B * L * L) / 6;
  const Zy = (L * B * B) / 6;
  
  const q_avg = (N_star * 1e3) / A;
  const q_max = q_avg + (Math.abs(Mx_star) * 1e6 / Zx) + (Math.abs(My_star) * 1e6 / Zy);
  const q_min = q_avg - (Math.abs(Mx_star) * 1e6 / Zx) - (Math.abs(My_star) * 1e6 / Zy);
  
  return {
    q_avg: q_avg * 1e-3, // kPa
    q_max: q_max * 1e-3, // kPa
    q_min: q_min * 1e-3, // kPa
    isTension: q_min < 0
  };
}

/**
 * One-Way Shear for Footings (Clause 13.4)
 */
export function calculateFootingOneWayShear(
  h: number,
  d: number,
  fc: number,
  B: number,
  L: number,
  q_max: number,
  columnSize: number = 500
) {
  // Critical section at distance d from column face
  const criticalDist = (L - columnSize) / 2 - d;
  if (criticalDist <= 0) return { phiVu: 9999, VStar: 0, isSafe: true };
  
  const VStar = q_max * B * criticalDist * 1e-3; // kN
  const kv = 0.15;
  const Vuc = kv * B * d * Math.sqrt(fc) * 1e-3;
  const phi = 0.75;
  
  return {
    phiVu: phi * Vuc,
    VStar,
    isSafe: VStar <= phi * Vuc
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
 * Generates points for an interaction diagram (Nu vs Mu)
 */
export function generateInteractionDiagram(
  b: number,
  h: number,
  Ast: number,
  materials: MaterialProperties,
  options: {
    phi?: number;
    useDesignValues?: boolean;
    nSteps?: number;
    barLayers?: number;
  } = {}
): { x: number; y: number }[] {
  const { fc, fsy, Es = 200000 } = materials;
  const { phi = 0.65, useDesignValues = true, nSteps = 50, barLayers = 4 } = options;
  
  const Ag = b * h;
  const alpha1 = 1.0 - 0.003 * fc;
  const alpha2 = Math.max(0.67, 0.85 - 0.0015 * fc);
  const gamma = Math.max(0.67, 0.97 - 0.0025 * fc);
  const epsilon_cu = 0.003;
  
  const points: { x: number; y: number }[] = [];
  
  // Steel distribution (simplified: equal layers)
  const layerAst = Ast / barLayers;
  const layerDepths: number[] = [];
  const cover = 50;
  for (let i = 0; i < barLayers; i++) {
    layerDepths.push(cover + (i * (h - 2 * cover) / (barLayers - 1 || 1)));
  }

  // 1. Pure Compression
  const Nuo = (alpha1 * fc * (Ag - Ast) + fsy * Ast) * 1e-3;
  const Nu_max = 0.8 * Nuo; // Clause 10.3.2
  
  // 2. Strain compatibility steps
  // We iterate through neutral axis depths from very large (pure compression) to 0 (pure tension)
  const dn_start = h * 10;
  const dn_end = 0.001;
  
  for (let i = 0; i <= nSteps; i++) {
    const t = i / nSteps;
    const dn = dn_start * Math.pow(1 - t, 3) + dn_end;

    let Cc = 0;
    let Mc = 0;
    
    // Concrete contribution
    const a = Math.min(gamma * dn, h);
    Cc = alpha2 * fc * b * a * 1e-3;
    Mc = Cc * (h / 2 - a / 2) * 1e-3; // Moment about centroid

    // Steel contribution
    let Ts = 0;
    let Ms = 0;
    for (const d_layer of layerDepths) {
      const epsilon_s = epsilon_cu * (dn - d_layer) / dn;
      const sigma_s = Math.max(-fsy, Math.min(fsy, epsilon_s * Es));
      const Fs = layerAst * sigma_s * 1e-3;
      Ts += Fs;
      Ms += Fs * (h / 2 - d_layer) * 1e-3;
    }

    const Nu = Cc + Ts;
    const Mu = Mc + Ms;

    // Clause 2.2.2: Dynamic phi for columns
    // phi transitions from 0.65 (compression) to 0.85 (tension)
    // Simplified transition based on Nu
    const Nu_bal = 0.3 * Nuo; // Rough estimate of balanced point
    let currentPhi = phi;
    if (useDesignValues) {
      if (Nu > Nu_bal) currentPhi = 0.65;
      else if (Nu < 0) currentPhi = 0.85;
      else currentPhi = 0.85 - (0.85 - 0.65) * (Nu / Nu_bal);
    } else {
      currentPhi = 1.0;
    }
    
    const cappedNu = Math.min(Nu, Nu_max);
    points.push({ x: currentPhi * Math.abs(Mu), y: currentPhi * cappedNu });
  }

  // 3. Pure Tension
  const Nut = -Ast * fsy * 1e-3;
  points.push({ x: 0, y: useDesignValues ? phi * Nut : Nut });

  // Remove duplicates and sort
  return points
    .filter((p, index, self) => 
      index === self.findIndex((t) => (
        Math.abs(t.x - p.x) < 0.1 && Math.abs(t.y - p.y) < 0.1
      ))
    )
    .sort((a, b) => b.y - a.y);
}

/**
 * Generates points for a column interaction diagram
 */
export function generateColumnInteractionDiagram(
  b: number,
  h: number,
  Ast: number,
  materials: MaterialProperties,
  options: { phi?: number; useDesignValues?: boolean } = {}
): { x: number; y: number }[] {
  return generateInteractionDiagram(b, h, Ast, materials, { ...options, barLayers: 4 });
}

/**
 * Generates points for a wall interaction diagram
 */
export function generateWallInteractionDiagram(
  tw: number,
  Lw: number,
  Ast: number,
  materials: MaterialProperties,
  options: { phi?: number; useDesignValues?: boolean } = {}
): { x: number; y: number }[] {
  // Walls are essentially large columns, usually with 2 layers of reinforcement
  return generateInteractionDiagram(tw, Lw, Ast, materials, { ...options, barLayers: 2 });
}

/**
 * Clause 6.10: Flat slabs - Design moments
 * Simplified distribution for Flat Plate slabs into Column and Middle strips
 */
export function calculateFlatPlateMoments(
  Lx: number, // Span in direction of moments
  Ly: number, // Span perpendicular to direction of moments
  qStar: number, // kPa
  isInternal: boolean = true
): {
  columnStrip: { pos: number; neg: number };
  middleStrip: { pos: number; neg: number };
  totalStatic: number;
} {
  // Total static moment M0 (Clause 6.10.4.1)
  // M0 = (q* * Ly * Lx^2) / 8
  const Lx_m = Lx / 1000;
  const Ly_m = Ly / 1000;
  const M0 = (qStar * Ly_m * Math.pow(Lx_m, 2)) / 8;

  // Distribution factors (Simplified based on AS 3600 Table 6.10.4.3)
  // For internal spans:
  const negFactor = 0.65;
  const posFactor = 0.35;

  // Strip distribution (Simplified based on Table 6.10.5.1 and 6.10.5.3)
  // Column Strip takes:
  // - 75% of negative moment
  // - 60% of positive moment
  const colNegFactor = 0.75;
  const colPosFactor = 0.60;

  const totalNeg = M0 * negFactor;
  const totalPos = M0 * posFactor;

  return {
    columnStrip: {
      neg: totalNeg * colNegFactor,
      pos: totalPos * colPosFactor
    },
    middleStrip: {
      neg: totalNeg * (1 - colNegFactor),
      pos: totalPos * (1 - colPosFactor)
    },
    totalStatic: M0
  };
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

export const EXPOSURE_CLASSES = [
  { id: 'A1', label: 'A1: Mild (Interior)', minCover: 20 },
  { id: 'A2', label: 'A2: Moderate (Exterior)', minCover: 25 },
  { id: 'B1', label: 'B1: Severe (Coastal)', minCover: 40 },
  { id: 'B2', label: 'B2: Very Severe', minCover: 60 },
  { id: 'C1', label: 'C1: Tropical/Marine', minCover: 70 },
  { id: 'C2', label: 'C2: Extreme', minCover: 80 },
];

export const FIRE_RATINGS = [
  { id: '30', label: '30 min', minB: 80, minCover: 20 },
  { id: '60', label: '60 min', minB: 120, minCover: 20 },
  { id: '90', label: '90 min', minB: 150, minCover: 25 },
  { id: '120', label: '120 min', minB: 200, minCover: 35 },
  { id: '180', label: '180 min', minB: 240, minCover: 45 },
  { id: '240', label: '240 min', minB: 280, minCover: 55 },
];

/**
 * Clause 4.10: Durability and Fire Resistance
 * Returns the maximum required cover based on exposure and fire.
 */
export function getRequiredCover(exposureId: string, fireId: string): number {
  const exp = EXPOSURE_CLASSES.find(e => e.id === exposureId)?.minCover || 20;
  const fire = FIRE_RATINGS.find(f => f.id === fireId)?.minCover || 20;
  return Math.max(exp, fire);
}

/**
 * NCC Compliance Check
 * Verifies if the design meets basic NCC Performance Requirements via DTS standards.
 */
export function checkNCCCompliance(data: {
  isStructuralSafe: boolean;
  isFireSafe: boolean;
  isDurable: boolean;
}) {
  return data.isStructuralSafe && data.isFireSafe && data.isDurable;
}
