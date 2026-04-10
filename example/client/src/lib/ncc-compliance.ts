/**
 * NCC (National Construction Code) Compliance Checker
 * Verifies designs against NCC 2022+ requirements
 */

export interface ComplianceCheck {
  standard: string;
  clause: string;
  requirement: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  reference?: string;
}

export interface ComplianceReport {
  projectName: string;
  elementType: string;
  checks: ComplianceCheck[];
  overallCompliant: boolean;
  timestamp: Date;
}

/**
 * Check structural design compliance with NCC
 */
export function checkStructuralCompliance(
  concreteStrength: number,
  steelStrength: number,
  designMethod: 'ULS' | 'SLS',
  loadCombination: string,
  reinforcementRatio: number,
  elementType: 'beam' | 'column' | 'slab' | 'wall' | 'footing'
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Check 1: Concrete strength requirements
  if (concreteStrength < 20) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Minimum concrete strength',
      status: 'fail',
      message: `Concrete strength ${concreteStrength} MPa is below minimum 20 MPa`,
      reference: 'AS 3600:2018 Clause 3.1',
    });
  } else if (concreteStrength >= 20 && concreteStrength <= 80) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Concrete strength within acceptable range',
      status: 'pass',
      message: `Concrete strength ${concreteStrength} MPa complies with AS 3600`,
      reference: 'AS 3600:2018 Clause 3.1',
    });
  } else if (concreteStrength > 80) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'High strength concrete',
      status: 'warning',
      message: `High strength concrete (${concreteStrength} MPa) requires special design considerations`,
      reference: 'AS 3600:2018 Clause 3.1',
    });
  }

  // Check 2: Steel reinforcement strength
  if (![250, 300, 500].includes(steelStrength)) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Steel reinforcement grade',
      status: 'warning',
      message: `Steel strength ${steelStrength} MPa is not standard. Use 250, 300, or 500 MPa`,
      reference: 'AS 3600:2018 Clause 3.2',
    });
  } else {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Steel reinforcement grade',
      status: 'pass',
      message: `Steel strength ${steelStrength} MPa is compliant`,
      reference: 'AS 3600:2018 Clause 3.2',
    });
  }

  // Check 3: Design method compliance
  if (designMethod === 'ULS') {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Ultimate Limit State design',
      status: 'pass',
      message: 'ULS design method is the primary design approach in AS 3600',
      reference: 'AS 3600:2018 Clause 2.2',
    });
  } else if (designMethod === 'SLS') {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Serviceability Limit State verification',
      status: 'pass',
      message: 'SLS verification required for deflection and cracking control',
      reference: 'AS 3600:2018 Clause 9',
    });
  }

  // Check 4: Load combination compliance
  if (loadCombination.includes('1.35G') || loadCombination.includes('1.2G')) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'Part 3.2',
      requirement: 'Load combinations',
      status: 'pass',
      message: `Load combination ${loadCombination} complies with AS 1170`,
      reference: 'AS 1170.0:2002 Table 4.2.2',
    });
  }

  // Check 5: Reinforcement ratio limits
  if (elementType === 'beam') {
    if (reinforcementRatio < 0.0012) {
      checks.push({
        standard: 'NCC 2022',
        clause: 'Part 3.2',
        requirement: 'Minimum reinforcement for crack control',
        status: 'fail',
        message: `Reinforcement ratio ${(reinforcementRatio * 100).toFixed(2)}% is below minimum 0.12%`,
        reference: 'AS 3600:2018 Clause 8.1.5',
      });
    } else if (reinforcementRatio > 0.04) {
      checks.push({
        standard: 'NCC 2022',
        clause: 'Part 3.2',
        requirement: 'Maximum reinforcement',
        status: 'fail',
        message: `Reinforcement ratio ${(reinforcementRatio * 100).toFixed(2)}% exceeds maximum 4%`,
        reference: 'AS 3600:2018 Clause 8.1.1',
      });
    } else {
      checks.push({
        standard: 'NCC 2022',
        clause: 'Part 3.2',
        requirement: 'Reinforcement ratio limits',
        status: 'pass',
        message: `Reinforcement ratio ${(reinforcementRatio * 100).toFixed(2)}% is within acceptable range`,
        reference: 'AS 3600:2018 Clause 8.1',
      });
    }
  }

  // Check 6: Durability requirements
  checks.push({
    standard: 'NCC 2022',
    clause: 'Part 3.2',
    requirement: 'Durability class selection',
    status: 'warning',
    message: 'Durability class must be selected based on exposure conditions',
    reference: 'AS 3600:2018 Clause 4',
  });

  // Check 7: Fire resistance requirements
  checks.push({
    standard: 'NCC 2022',
    clause: 'Part C',
    requirement: 'Fire resistance rating',
    status: 'warning',
    message: 'Fire resistance rating must be determined based on building classification',
    reference: 'NCC 2022 Part C Fire Resistance',
  });

  return checks;
}

/**
 * Check residential design compliance (AS 2870)
 */
export function checkResidentialCompliance(
  slabThickness: number,
  concreteStrength: number,
  soilBearingCapacity: number,
  designMethod: 'WSD' | 'USD'
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Check 1: Slab thickness
  if (slabThickness < 100) {
    checks.push({
      standard: 'AS 2870',
      clause: '3.2',
      requirement: 'Minimum slab thickness',
      status: 'fail',
      message: `Slab thickness ${slabThickness} mm is below minimum 100 mm`,
      reference: 'AS 2870:2011 Clause 3.2',
    });
  } else {
    checks.push({
      standard: 'AS 2870',
      clause: '3.2',
      requirement: 'Slab thickness',
      status: 'pass',
      message: `Slab thickness ${slabThickness} mm complies with AS 2870`,
      reference: 'AS 2870:2011 Clause 3.2',
    });
  }

  // Check 2: Concrete strength for residential
  if (concreteStrength < 25) {
    checks.push({
      standard: 'AS 2870',
      clause: '3.3',
      requirement: 'Minimum concrete strength',
      status: 'fail',
      message: `Concrete strength ${concreteStrength} MPa is below recommended 25 MPa for residential slabs`,
      reference: 'AS 2870:2011 Clause 3.3',
    });
  } else {
    checks.push({
      standard: 'AS 2870',
      clause: '3.3',
      requirement: 'Concrete strength',
      status: 'pass',
      message: `Concrete strength ${concreteStrength} MPa complies with AS 2870`,
      reference: 'AS 2870:2011 Clause 3.3',
    });
  }

  // Check 3: Soil bearing capacity
  if (soilBearingCapacity < 50) {
    checks.push({
      standard: 'AS 2870',
      clause: '2.3',
      requirement: 'Minimum soil bearing capacity',
      status: 'warning',
      message: `Soil bearing capacity ${soilBearingCapacity} kPa is low. Verify soil investigation`,
      reference: 'AS 2870:2011 Clause 2.3',
    });
  }

  return checks;
}

/**
 * Generate compliance report
 */
export function generateComplianceReport(
  projectName: string,
  elementType: string,
  checks: ComplianceCheck[]
): ComplianceReport {
  const failedChecks = checks.filter((c) => c.status === 'fail');
  const overallCompliant = failedChecks.length === 0;

  return {
    projectName,
    elementType,
    checks,
    overallCompliant,
    timestamp: new Date(),
  };
}

/**
 * Format compliance report as text
 */
export function formatComplianceReport(report: ComplianceReport): string {
  let text = `\n=== NCC COMPLIANCE REPORT ===\n`;
  text += `Project: ${report.projectName}\n`;
  text += `Element Type: ${report.elementType}\n`;
  text += `Date: ${report.timestamp.toISOString()}\n`;
  text += `Overall Status: ${report.overallCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}\n\n`;

  text += `=== COMPLIANCE CHECKS ===\n`;
  report.checks.forEach((check, index) => {
    text += `\n${index + 1}. ${check.standard} - ${check.clause}\n`;
    text += `   Requirement: ${check.requirement}\n`;
    text += `   Status: ${check.status.toUpperCase()}\n`;
    text += `   Message: ${check.message}\n`;
    if (check.reference) {
      text += `   Reference: ${check.reference}\n`;
    }
  });

  return text;
}

/**
 * Export compliance data as JSON
 */
export function exportComplianceJSON(report: ComplianceReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Check NCC building classification requirements
 */
export function checkBuildingClassification(
  buildingClass: number,
  storeys: number,
  area: number
): ComplianceCheck[] {
  const checks: ComplianceCheck[] = [];

  // Class 1: Single dwelling or dual occupancy
  if (buildingClass === 1) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'A2.1',
      requirement: 'Class 1 building classification',
      status: 'pass',
      message: 'Class 1 building: Single dwelling or dual occupancy',
      reference: 'NCC 2022 Clause A2.1',
    });
  }

  // Class 2: Multi-unit residential
  if (buildingClass === 2) {
    if (storeys > 25) {
      checks.push({
        standard: 'NCC 2022',
        clause: 'A2.2',
        requirement: 'Class 2 building height limitation',
        status: 'warning',
        message: `Class 2 building exceeds typical storey limit (${storeys} storeys)`,
        reference: 'NCC 2022 Clause A2.2',
      });
    }
  }

  // Class 5: Office buildings
  if (buildingClass === 5) {
    checks.push({
      standard: 'NCC 2022',
      clause: 'A2.5',
      requirement: 'Class 5 building classification',
      status: 'pass',
      message: 'Class 5 building: Office and professional spaces',
      reference: 'NCC 2022 Clause A2.5',
    });
  }

  return checks;
}
