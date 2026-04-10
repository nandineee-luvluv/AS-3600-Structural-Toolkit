# Quick Reference - New Modules & Exports

## Available Imports

### From `src/lib/ncc-compliance.ts`

```typescript
import {
  // Interfaces
  ComplianceCheck,
  ComplianceReport,
  
  // Core Functions
  checkStructuralCompliance,
  checkResidentialCompliance,
  generateComplianceReport,
  formatComplianceReport,
  exportComplianceJSON,
  checkBuildingClassification
} from '@/lib/ncc-compliance';
```

**Type Definitions:**
```typescript
interface ComplianceCheck {
  standard: string;           // e.g., "NCC 2022"
  clause: string;             // e.g., "Part 3.2"
  requirement: string;        // Human-readable requirement
  status: 'pass' | 'fail' | 'warning';
  message: string;            // Detailed explanation
  reference?: string;         // Standard reference
}

interface ComplianceReport {
  projectName: string;
  elementType: string;
  checks: ComplianceCheck[];
  overallCompliant: boolean;
  timestamp: Date;
}
```

---

### From `src/lib/as3600-enhanced.ts`

```typescript
import {
  // Interfaces
  ConcreteProperties,
  SteelProperties,
  DesignParameters,
  BeamDesignInput,
  SlabDesignInput,
  ColumnDesignInput,
  
  // Helper Functions
  getConcreteDesignStrength,
  getSteelDesignStrength,
  calculateEffectiveDepth,
  calculateFactoredLoads,
  calculateBeamMomentCapacity,
  calculateBeamShearCapacity,
  calculateBeamReinforcement,
  calculateSlabMoments,
  calculateColumnInteractionDiagram,
  verifyAS3600Compliance,
  calculateMinimumReinforcement,
  calculateDevelopmentLength,
  checkDeflection,
  checkCrackWidth
} from '@/lib/as3600-enhanced';
```

**Key Type Definition:**
```typescript
interface DesignParameters {
  concrete: ConcreteProperties;
  steel: SteelProperties;
  phiFactor: number;  // Capacity reduction factor
  cover: number;      // Concrete cover (mm)
}
```

---

### From `src/components/ui/ComplianceInfo.tsx`

```typescript
import {
  ComplianceInfo,                    // Original component
  ComplianceChecksDisplay            // NEW: Displays structured checks
} from '@/components/ui/ComplianceInfo';
```

**ComplianceChecksDisplay Props:**
```typescript
interface ComplianceChecksDisplayProps {
  checks: ComplianceCheck[];
  className?: string;
}
```

---

## Usage Examples

### Example 1: Get Compliance Checks for a Beam
```typescript
import { checkStructuralCompliance } from '@/lib/ncc-compliance';

const checks = checkStructuralCompliance(
  fc: 32,              // Concrete strength (MPa)
  fsy: 500,            // Steel strength (MPa)
  'ULS',               // Design method
  '1.2G + 1.5Q',      // Load combination ID
  0.015,              // Reinforcement ratio (Ast/(b*d))
  'beam'              // Element type
);

// checks is now ComplianceCheck[]
console.log(checks.length);  // Number of checks performed
```

### Example 2: Display Compliance Checks in React
```typescript
import { ComplianceChecksDisplay } from '@/components/ui/ComplianceInfo';

<ComplianceChecksDisplay 
  checks={structuralComplianceChecks}
  className="max-h-64 overflow-y-auto"
/>
```

### Example 3: Generate a Report
```typescript
import { 
  checkStructuralCompliance,
  generateComplianceReport,
  formatComplianceReport,
  exportComplianceJSON 
} from '@/lib/ncc-compliance';

const checks = checkStructuralCompliance(32, 500, 'ULS', '1.2G+1.5Q', 0.015, 'beam');
const report = generateComplianceReport('My Project', 'Beam', checks);

// Format as text
const textReport = formatComplianceReport(report);
console.log(textReport);

// Export as JSON
const jsonReport = exportComplianceJSON(report);
localStorage.setItem('compliance-report', jsonReport);
```

### Example 4: Enhanced Calculation Functions
```typescript
import {
  calculateEffectiveDepth,
  calculateFactoredLoads,
  calculateBeamMomentCapacity,
  DesignParameters
} from '@/lib/as3600-enhanced';

const parameters: DesignParameters = {
  concrete: {
    fck: 32,
    fc: 0.85 * 32,
    Ec: 5000 * Math.sqrt(32),
    epsilonCu: 0.003
  },
  steel: {
    fyk: 500,
    fy: 0.87 * 500,
    Es: 200000,
    epsilonSu: 0.05
  },
  phiFactor: 0.85,
  cover: 40
};

// Calculate effective depth
const d = calculateEffectiveDepth(600, 40, 20, 10);

// Calculate factored loads
const loads = calculateFactoredLoads(20, 10, 0, 0);
console.log(loads.maximum);  // Maximum factored load

// Calculate moment capacity
const capacity = calculateBeamMomentCapacity(300, d, 1500, parameters);
console.log(capacity.Mu);  // Moment capacity in kN.m
```

### Example 5: Complete Beam Design Workflow
```typescript
import { 
  checkStructuralCompliance,
  calculateBeamMomentCapacity,
  ComplianceChecksDisplay
} from '@/lib/ncc-compliance';

// Calculate design
const Mu = 150;  // Design moment (kNm)
const capacity = calculateBeamMomentCapacity(300, 550, 1500, params);

// Check compliance
const checks = checkStructuralCompliance(32, 500, 'ULS', '1.2G+1.5Q', 0.015, 'beam');

// Display to user
const ratio = capacity.Mu >= Mu ? 'PASS' : 'FAIL';

<>
  <div>Capacity: {capacity.Mu.toFixed(1)} kNm | Demand: {Mu} kNm | {ratio}</div>
  <ComplianceChecksDisplay checks={checks} />
</>
```

---

## Key Functions Reference

| Function | Purpose | Returns |
|----------|---------|---------|
| `getConcreteDesignStrength(fck)` | Design strength from char strength | `number` |
| `getSteelDesignStrength(fyk)` | Steel design strength (0.87×fyk) | `number` |
| `calculateEffectiveDepth(...)` | Effective depth for flexure | `number` |
| `calculateFactoredLoads(...)` | All ULS load combinations | `{ uls1...uls6, maximum }` |
| `calculateBeamMomentCapacity(...)` | Moment capacity | `{ Mu, lever, strain }` |
| `calculateBeamShearCapacity(...)` | Shear capacity | `{ Vu, Vc, Vs }` |
| `calculateMinimumReinforcement(...)` | Min steel area | `number` |
| `calculateDevelopmentLength(...)` | Bar development length | `number` |
| `checkDeflection(...)` | Span/depth ratio check | `{ limit, actual, compliant }` |
| `checkCrackWidth(...)` | Crack width control | `{ crackWidth, limit, compliant }` |
| `checkStructuralCompliance(...)` | Structural compliance checks | `ComplianceCheck[]` |

---

## Standards References

All functions reference:
- **AS 3600:2018** - Concrete Structures
- **AS 1170** - Load Combinations
- **NCC 2022** - National Construction Code
- **AS 2870:2011** - Residential Slabs

---

## Integration Status

| Component | Status | Location |
|-----------|--------|----------|
| ncc-compliance module | ✅ Complete | src/lib/ncc-compliance.ts |
| as3600-enhanced module | ✅ Complete | src/lib/as3600-enhanced.ts |
| ComplianceChecksDisplay | ✅ Complete | src/components/ui/ComplianceInfo.tsx |
| BeamCalculator integration | ✅ Complete | src/components/calculators/BeamCalculator.tsx |
| ColumnCalculator | 🚀 Ready | See INTEGRATION_EXTENSION_GUIDE.md |
| SlabCalculator | 🚀 Ready | See INTEGRATION_EXTENSION_GUIDE.md |
| WallCalculator | 🚀 Ready | See INTEGRATION_EXTENSION_GUIDE.md |

---

## Learn More

- **INTEGRATION_SUMMARY.md** - Complete overview of all changes
- **INTEGRATION_EXTENSION_GUIDE.md** - Step-by-step for other calculators
- **BeamCalculator.tsx** - Working reference implementation
- **instructions.md** - Development guidelines

---

**Last Updated**: April 10, 2026
**Build Status**: ✅ Successful (npm run build)
