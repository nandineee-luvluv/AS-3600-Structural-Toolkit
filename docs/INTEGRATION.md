# Integration Guide - Professional Component Implementation

**Complete guide for integrating professional components into the AS-3600 Structural Toolkit.**

---

## Overview

The AS-3600 Structural Toolkit has been comprehensively enhanced with professional-grade components. This guide covers:
- ✅ Integration patterns and best practices
- ✅ Component architecture and usage
- ✅ Step-by-step implementation instructions
- ✅ Extension templates for all calculators

---

## Part 1: Integration Summary & Architecture

### Professional Component Layers

The toolkit is organized in tiers for modular integration:

#### Tier 1: Core Professional Components (`ProfessionalComponents.tsx`)
**9 reusable UI components**:
- `DesignInputCard` - Clean section container with title/description
- `DesignResultCard` - Result display with pass/fail status badges
- `ComplianceStatus` - Visual compliance indicator badges
- `InputField` - Professional number input with validation
- `TabGroup` - Tab navigation for complex interfaces
- `SectionProfile` - SVG cross-section visualization
- `LoadDiagram` - SVG beam load and reaction diagram
- `DesignReference` - Code reference callout panels
- `Alert` - Color-coded alerts (error/warning/info/success)

#### Tier 2: Design Results Summary (`DesignResultsSummary.tsx`)
**5-tab professional interface**:
1. **Overview** - Design status, dimensions, compliance badges
2. **ULS Design** - Moment/shear capacity with ratios
3. **SLS Checks** - Deflection, crack width, stresses
4. **Reinforcement** - Bar schedule with validation
5. **Compliance** - AS 3600, NCC, constructability checks

#### Tier 3: Material Database (`MaterialDatabase.tsx`)
**Pre-configured material properties**:
- 7 concrete grades (C20 - C80)
- 2 steel grades (N500, N600)
- Grade selectors and property displays

#### Tier 4: Calculator Wrappers (`CalculatorWrappers.tsx`)
**Reusable wrapper components**:
- `ProfessionalInputGroup` - Enhanced input container
- `QuickMaterialSelector` - Material selection interface
- `ComplianceResultCard` - Professional result display
- `GeometryInputs` - Pre-configured geometry inputs
- `LoadInputs` - Pre-configured load inputs
- `DesignComplianceSummary` - Compliance status dashboard

---

## Part 2: Integration Patterns & Code Examples

### Pattern 1: Basic Component Usage

```typescript
import { DesignInputCard, InputField } from '@/components/ui/ProfessionalComponents';

<DesignInputCard title="Member Geometry" description="Define dimensions">
  <InputField
    label="Span"
    value={span}
    onChange={setSpan}
    unit="mm"
    helper="Clear span between supports"
  />
</DesignInputCard>
```

### Pattern 2: Material Selection Integration

```typescript
import {
  ConcreteGradeSelector,
  SteelGradeSelector,
  MaterialPropertiesDisplay
} from '@/components/ui/MaterialDatabase';

<DesignInputCard title="Material Properties" description="Select grades per AS 3600">
  <ConcreteGradeSelector selected={fc} onChange={setFc} />
  <SteelGradeSelector selected={fsy} onChange={setFsy} />
  <MaterialPropertiesDisplay concreteGrade={fc} steelGrade={fsy} />
</DesignInputCard>
```

### Pattern 3: Professional Results Display

```typescript
import DesignResultsSummary from '@/components/ui/DesignResultsSummary';

const design: DesignSummary = {
  memberId: 'Beam 1',
  designMethod: 'ULS',
  inputs: { span: 6000, width: 300, depth: 600 },
  uls: { 
    appliedMoment: 180, 
    momentCapacity: 210,
    appliedShear: 150,
    shearCapacity: 180
  },
  sls: { 
    deflectionActual: 18, 
    deflectionLimit: 24 
  },
  compliance: { as3600: true, ncc: true }
};

<DesignResultsSummary design={design} />
```

### Pattern 4: Compliance Integration

```typescript
import { checkStructuralCompliance } from '@/lib/ncc-compliance';
import { ComplianceChecksDisplay } from '@/components/ui/ComplianceInfo';

const checks = checkStructuralCompliance(
  fc, fsy, 'ULS', '1.2G+1.5Q', 
  Ast / (width * d), 'beam'
);

<ComplianceChecksDisplay checks={checks} />
```

---

## Part 3: Step-by-Step Integration Instructions

### Step 1: Import Required Components

In your calculator file, add:

```typescript
import {
  DesignInputCard,
  DesignResultCard,
  ComplianceStatus,
  InputField,
  Alert
} from '@/components/ui/ProfessionalComponents';

import DesignResultsSummary, { DesignSummary } from '@/components/ui/DesignResultsSummary';

import {
  ConcreteGradeSelector,
  SteelGradeSelector
} from '@/components/ui/MaterialDatabase';

import {
  calculateEffectiveDepth,
  checkDeflectionCompliance
} from '@/lib/professional-design-engine';

import { checkStructuralCompliance } from '@/lib/ncc-compliance';
```

### Step 2: Define State Structure

```typescript
interface DesignState {
  // Geometry
  span: number;
  width: number;
  depth: number;
  cover: number;
  
  // Materials
  fc: number;
  fsy: number;
  
  // Loads
  deadLoad: number;
  liveLoad: number;
  
  // Results
  design?: DesignSummary;
  complianceChecks?: ComplianceCheck[];
}
```

### Step 3: Replace Input Groups

**Before**:
```typescript
<InputGroup>
  <InputField label="Span" value={span} onChange={setSpan} />
</InputGroup>
```

**After**:
```typescript
<DesignInputCard title="Member Geometry" description="Define dimensions">
  <InputField label="Span" value={span} onChange={setSpan} unit="mm" />
</DesignInputCard>
```

### Step 4: Add Professional Results Display

```typescript
const design: DesignSummary = {
  memberId: 'Beam Design',
  designMethod: 'ULS',
  inputs: { span, width, depth, cover, fc, fsy },
  uls: calculateULSDesign(inputs),
  sls: calculateSLSDesign(inputs),
  compliance: { as3600: true, ncc: true, as1170: true }
};

return (
  <div className="space-y-6">
    {/* Input sections */}
    <DesignResultsSummary design={design} />
  </div>
);
```

### Step 5: Add Compliance Checking

```typescript
const complianceChecks = useMemo(() => {
  return checkStructuralCompliance(
    fc, fsy, 'ULS', '1.2G + 1.5Q',
    Ast / (width * d), 'beam'
  );
}, [fc, fsy, Ast, width, d]);

return (
  <div>
    <ComplianceChecksDisplay checks={complianceChecks} />
  </div>
);
```

---

## Part 4: Extension Guide for Other Calculators

### Template for ColumnCalculator

```typescript
// src/components/calculators/ColumnCalculator.tsx

import { checkStructuralCompliance } from '@/lib/ncc-compliance';
import { calculateColumnInteractionDiagram } from '@/lib/as3600-enhanced';
import DesignResultsSummary from '@/components/ui/DesignResultsSummary';

const ColumnCalculator = () => {
  // ... state and calculations ...
  
  const design: DesignSummary = {
    memberId: 'Column Design',
    designMethod: 'Interaction Diagram',
    inputs: { /*...*/ },
    uls: {
      appliedAxial: P_star,
      appliedMoment: M_star,
      capacity: interactionCapacity,
      safe: true
    },
    compliance: {
      as3600: true,
      ncc: checkCompliance.every(c => c.status === 'pass')
    }
  };
  
  return <DesignResultsSummary design={design} />;
};
```

### Template for SlabCalculator

```typescript
// src/components/calculators/SlabCalculator.tsx

import { calculateSlabMoments } from '@/lib/as3600-enhanced';
import DesignResultsSummary from '@/components/ui/DesignResultsSummary';

const SlabCalculator = () => {
  // Two-way slab analysis
  const moments = calculateSlabMoments(length_x, length_y, fc, fsy);
  
  const design: DesignSummary = {
    memberId: 'Slab Design',
    designMethod: 'Two-Way Analysis',
    inputs: { /*...*/ },
    uls: {
      appliedMoment: moments.Mx,
      momentCapacity: capacity,
      momentSafe: true
    },
    compliance: { /*...*/ }
  };
  
  return <DesignResultsSummary design={design} />;
};
```

---

## Part 5: Professional Design Engine Integration

### Available Calculation Functions

```typescript
import {
  // Material properties
  getConcreteDesignStrength,
  getSteelDesignStrength,
  
  // Section properties
  calculateEffectiveDepth,
  
  // Flexural design
  calculateRectangularStressBlockMoment,
  calculateRequiredReinforcementForMoment,
  
  // Shear design
  calculateShearCapacityGeneralMethod,
  
  // Serviceability
  checkDeflectionCompliance,
  checkCrackWidthCompliance,
  
  // Detailing
  calculateDevelopmentLength
} from '@/lib/professional-design-engine';
```

### Usage Example

```typescript
const effectiveDepth = calculateEffectiveDepth(
  totalDepth,    // h = 600mm
  cover,         // c = 40mm
  stirrupDiam,   // 10mm
  barDiam        // 20mm
);

const momentCapacity = calculateRectangularStressBlockMoment(
  width,         // b = 300mm
  effectiveDepth,// d = 544mm
  Ast,          // 3000mm²
  fc,           // 32 MPa
  fsy           // 500 MPa
);
```

---

## Part 6: Standards Compliance Integration

### AS 3600:2018 Checks

```typescript
import { checkStructuralCompliance } from '@/lib/ncc-compliance';

const checks = checkStructuralCompliance(
  concreteStrength,    // fc = 32 MPa
  steelStrength,       // fsy = 500 MPa
  'ULS',              // Design method
  '1.2G + 1.5Q',      // Load combination
  reinforcementRatio,  // ρ = Ast/(b×d)
  'beam'              // Element type
);

// Returns: ComplianceCheck[]
// - Concrete strength validation
// - Steel grade compliance
// - Design method verification
// - Load combination validation
// - Reinforcement ratio limits
```

### NCC 2022 Compliance Checking

```typescript
import { ComplianceChecksDisplay } from '@/components/ui/ComplianceInfo';

<ComplianceChecksDisplay 
  checks={checks}
  className="max-h-64 overflow-y-auto"
/>
```

---

## Integration Checklist

- [ ] Import professional components
- [ ] Define state interfaces
- [ ] Replace input groups with professional components
- [ ] Implement calculations using professional-design-engine
- [ ] Add DesignResultsSummary with populated data
- [ ] Integrate compliance checking
- [ ] Test all tabs in results display
- [ ] Verify TypeScript compilation
- [ ] Test professional styling
- [ ] Verify export functionality

---

## Troubleshooting

### Issue: Component not found
**Solution**: Verify import path matches file location
```typescript
// Correct
import { DesignInputCard } from '@/components/ui/ProfessionalComponents';

// Incorrect
import { DesignInputCard } from '@/components/ProfessionalComponents';
```

### Issue: Type errors in DesignSummary
**Solution**: Ensure all required fields are populated
```typescript
const design: DesignSummary = {
  memberId: 'required',
  designMethod: 'required',
  inputs: { /*required*/ },
  uls: { /*required fields*/ },
  sls: { /*required fields*/ },
  compliance: { /*required fields*/ }
};
```

### Issue: Compliance checks not showing
**Solution**: Verify ComplianceCheck array is properly passed
```typescript
// Ensure checks are calculated before rendering
const [checks, setChecks] = useState<ComplianceCheck[]>([]);

useEffect(() => {
  const calculated = checkStructuralCompliance(
    fc, fsy, 'ULS', '1.2G+1.5Q', ratio, 'element'
  );
  setChecks(calculated);
}, [fc, fsy, ratio]);
```

---

## Next Steps

1. **Review** the DEVELOPMENT.md for API reference
2. **Check** PROJECT_STATUS.md for completion details
3. **Reference** skills.md for development best practices
4. **Test** integration with your calculator
5. **Export** results and verify professional output

---

**Last Updated**: April 21, 2026  
**Status**: Complete & Ready for Implementation
