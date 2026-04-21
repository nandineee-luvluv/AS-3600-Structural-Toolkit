# Development Skills & Best Practices Guide

**Professional development guidelines, best practices, and workflow recommendations for the AS-3600 Structural Toolkit.**

---

## Table of Contents

1. [TypeScript Best Practices](#typescript-best-practices)
2. [React Component Patterns](#react-component-patterns)
3. [Standards Compliance Workflow](#standards-compliance-workflow)
4. [Testing & Quality Assurance](#testing--quality-assurance)
5. [Code Organization](#code-organization)
6. [Performance Optimization](#performance-optimization)
7. [Documentation Standards](#documentation-standards)
8. [Debugging & Troubleshooting](#debugging--troubleshooting)

---

## TypeScript Best Practices

### 1. Strict Mode Configuration

Always work with TypeScript strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Verification**:
```bash
# Always check types before committing
npx tsc --noEmit
# Should return 0 errors
```

### 2. Interface Definition Standards

```typescript
// ✅ GOOD: Clear, well-documented interfaces
interface DesignResults {
  /** Applied moment in kNm */
  appliedMoment: number;
  
  /** Moment capacity in kNm */
  momentCapacity: number;
  
  /** Whether design is safe */
  isSafe: boolean;
}

// ❌ AVOID: Implicit types
const results: any = { ...};

// ❌ AVOID: Missing documentation
interface Results {
  M: number;
  Mu: number;
  safe: boolean;
}
```

### 3. Generic Type Patterns

```typescript
// ✅ GOOD: Generic functions for reusability
function calculateCapacity<T extends DesignInput>(
  input: T,
  parameters: DesignParameters
): CalculationResult<T> {
  // Implementation
}

// ❌ AVOID: Function overloads where generics work
function calculateBeamCapacity(input: BeamInput): BeamResult;
function calculateSlabCapacity(input: SlabInput): SlabResult;
```

### 4. Union Types for Design Methods

```typescript
// ✅ GOOD: Explicit union types
type DesignMethod = 'ULS' | 'SLS';
type LoadCombination = '1.2G + 1.5Q' | '1.2G + 1.5Q + 0.5W';

// ✅ GOOD: Const assertions for stricter typing
const DESIGN_METHODS = ['ULS', 'SLS'] as const;
type DesignMethodType = typeof DESIGN_METHODS[number];

// ❌ AVOID: String literals without typing
function designCalculation(method: string) { ... }
```

---

## React Component Patterns

### 1. Functional Component Structure

```typescript
import React, { useState, useMemo, useCallback } from 'react';

interface ComponentProps {
  title: string;
  onComplete?: (result: Result) => void;
}

export const CalculatorComponent: React.FC<ComponentProps> = ({
  title,
  onComplete
}) => {
  // 1. State management
  const [inputs, setInputs] = useState<Inputs>({});
  const [results, setResults] = useState<Results | null>(null);

  // 2. Computed values
  const calculated = useMemo(() => {
    return calculateDesign(inputs);
  }, [inputs]);

  // 3. Event handlers
  const handleChange = useCallback((newInputs: Inputs) => {
    setInputs(newInputs);
  }, []);

  const handleSubmit = useCallback(() => {
    if (calculated) {
      setResults(calculated);
      onComplete?.(calculated);
    }
  }, [calculated, onComplete]);

  // 4. Early returns for errors
  if (!inputs.width) {
    return <Alert>Width is required</Alert>;
  }

  // 5. JSX return
  return (
    <div className="space-y-6">
      <h2>{title}</h2>
      {/* Content */}
    </div>
  );
};
```

### 2. Custom Hooks Pattern

```typescript
// ✅ GOOD: Extract complex logic to custom hooks
function useDesignCalculations(inputs: DesignInputs) {
  const [results, setResults] = useState<DesignResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const result = calculateDesign(inputs);
      setResults(result);
      setError(null);
    } catch (err) {
      setError(String(err));
      setResults(null);
    }
  }, [inputs]);

  return { results, error };
}

// Usage:
const { results, error } = useDesignCalculations(inputs);
```

### 3. Component Composition

```typescript
// ✅ GOOD: Compose small, focused components
interface DesignInputCardProps {
  title: string;
  children: React.ReactNode;
}

export const DesignInputCard: React.FC<DesignInputCardProps> = ({
  title,
  children
}) => (
  <div className="border rounded p-4">
    <h3 className="font-bold mb-4">{title}</h3>
    {children}
  </div>
);

// Usage in calculator:
<DesignInputCard title="Geometry">
  <GeometryInputs />
</DesignInputCard>

<DesignInputCard title="Materials">
  <MaterialSelectors />
</DesignInputCard>
```

### 4. Controlled Components

```typescript
// ✅ GOOD: Always use controlled components
interface InputFieldProps {
  value: number;
  onChange: (value: number) => void;
  unit?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  value,
  onChange,
  unit
}) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    placeholder={unit ? `Enter value (${unit})` : 'Enter value'}
  />
);

// ❌ AVOID: Uncontrolled components
<input type="number" defaultValue={10} />
```

---

## Standards Compliance Workflow

### 1. AS 3600:2018 Compliance Integration

**Workflow**:
1. Read requirement from standard
2. Identify clause reference
3. Implement validation function
4. Add to ComplianceCheck array
5. Display in results

```typescript
// Example: Implementing crack control check (Clause 9.4.1)

const checkCrackControl = (inputs: {
  cover: number;
  barDiam: number;
  spacing: number;
  exposureClass: string;
}): ComplianceCheck => {
  const limits = {
    'Mild': 0.40,      // 0.40 mm
    'Moderate': 0.30,  // 0.30 mm
    'Aggressive': 0.20 // 0.20 mm
  };

  const limit = limits[inputs.exposureClass] || 0.30;
  const actual = calculateCrackWidth(inputs);

  return {
    standard: 'AS 3600:2018',
    clause: '9.4.1',
    requirement: `Crack width limit for ${inputs.exposureClass} exposure`,
    status: actual <= limit ? 'pass' : 'fail',
    message: `Crack width: ${actual.toFixed(2)} mm (limit: ${limit} mm)`,
    reference: 'AS 3600 Clause 9.4.1 - Crack width control'
  };
};
```

### 2. NCC 2022 Integration

**Workflow**:
1. Identify building classification requirement
2. Map to NCC clause
3. Implement validation
4. Return ComplianceCheck

```typescript
const checkBuildingClass = (buildingClass: string): ComplianceCheck => {
  const validClasses = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'];
  
  return {
    standard: 'NCC 2022',
    clause: 'Part A - Planning',
    requirement: 'Building class must be valid per NCC definition',
    status: validClasses.includes(buildingClass) ? 'pass' : 'fail',
    message: `Building class: ${buildingClass}`,
    reference: 'NCC 2022 - Building Classification'
  };
};
```

### 3. Load Combination Application (AS 1170)

```typescript
// Always use proper load combinations
const ULS_COMBINATIONS = {
  permanent: 1.2,      // 1.2G
  imposed: 1.5,        // 1.5Q
  wind: 1.0,           // 1.0W
};

const SLS_COMBINATIONS = {
  permanent: 1.0,      // G
  imposed: 1.0,        // Q
  wind: 1.0,           // W
};

function getFactoredLoads(
  type: 'ULS' | 'SLS',
  g: number,
  q: number,
  w?: number
): number {
  const factors = type === 'ULS' ? ULS_COMBINATIONS : SLS_COMBINATIONS;
  return (g * factors.permanent + q * factors.imposed + (w || 0) * factors.wind);
}
```

---

## Testing & Quality Assurance

### 1. Component Testing Pattern

```typescript
import { render, screen, fireEvent } from '@testing-library/react';

describe('DesignInputCard', () => {
  it('should render with title', () => {
    render(<DesignInputCard title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle input changes', () => {
    const onChange = jest.fn();
    render(
      <InputField 
        value={100} 
        onChange={onChange}
        label="Width"
      />
    );
    
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '200' }
    });
    
    expect(onChange).toHaveBeenCalledWith(200);
  });
});
```

### 2. Calculation Verification

```typescript
// Test against known values from standards
describe('Moment Capacity Calculation', () => {
  it('should match AS 3600 example calculations', () => {
    const result = calculateMomentCapacity({
      b: 300,      // mm
      d: 500,      // mm
      Ast: 1500,   // mm²
      fc: 32,      // MPa
      fsy: 500     // MPa
    });

    // Known good value from standard example
    expect(result.phiMu).toBeCloseTo(180, 1); // 180 kNm ±1
  });
});
```

### 3. Pre-commit Checklist

```bash
# Before committing code:
npx tsc --noEmit           # Type check
npm run build              # Build check
npm test                   # Unit tests
npm run lint               # Code style
```

---

## Code Organization

### 1. Module Structure

```
src/
├── lib/
│   ├── ncc-compliance.ts          # Standards checks
│   ├── as3600-enhanced.ts         # Design helpers
│   ├── professional-design-engine.ts # Calculations
│   ├── as3600.ts                  # Core calcs
│   ├── as1170.ts                  # Load combos
│   ├── exportUtils.ts             # Export logic
│   └── utils.ts                   # Helpers
├── components/
│   ├── calculators/               # Calculator components
│   ├── ui/                        # UI components
│   └── Xxx.tsx                    # Other components
└── contexts/                      # State management
```

### 2. File Naming Conventions

```
✅ GOOD:
- DesignInputCard.tsx (Component)
- calculateMomentCapacity.ts (Function in lib)
- useDesignCalculations.ts (Custom hook)
- ComplianceCheck.ts (Type definitions)

❌ AVOID:
- Component.tsx (Too generic)
- calc.ts (Too short/cryptic)
- helpers.ts (Too vague)
- types.d.ts (Use separate interfaces)
```

### 3. Import Organization

```typescript
// ✅ GOOD: Organized imports
// 1. React & external libraries
import React, { useState, useMemo } from 'react';
import { Download } from 'lucide-react';

// 2. Types/Interfaces
import type { DesignResults, ComplianceCheck } from '@/lib/types';

// 3. Internal components
import { DesignInputCard } from '@/components/ui/ProfessionalComponents';

// 4. Internal utilities
import { calculateMomentCapacity } from '@/lib/as3600-enhanced';

// ❌ AVOID: Random import order
import { calculateMomentCapacity } from '@/lib/as3600-enhanced';
import React from 'react';
import { DesignInputCard } from '@/components/ui/ProfessionalComponents';
```

---

## Performance Optimization

### 1. Memoization Pattern

```typescript
// Memoize expensive calculations
const momentCapacity = useMemo(() => {
  return calculateMomentCapacity({
    b, d, Ast, fc, fsy
  });
}, [b, d, Ast, fc, fsy]);

// Memoize callbacks
const handleChange = useCallback((value: number) => {
  setInputValue(value);
}, []);

// Memoize components
export const DesignCard = React.memo(
  ({ design }: { design: DesignResults }) => (
    <div>{/* Content */}</div>
  )
);
```

### 2. Lazy Loading

```typescript
// Load heavy components on demand
const BeamCalculator = React.lazy(
  () => import('@/components/calculators/BeamCalculator')
);

export const App = () => (
  <Suspense fallback={<Loading />}>
    <BeamCalculator />
  </Suspense>
);
```

### 3. Avoid Unnecessary Re-renders

```typescript
// ✅ GOOD: Minimize re-renders
function CalculatorComponent() {
  const [inputs, setInputs] = useState(initialInputs);

  // Only recalculate when inputs change
  const results = useMemo(
    () => calculateDesign(inputs),
    [inputs]
  );

  return (
    <div>
      <InputSection inputs={inputs} onChange={setInputs} />
      <ResultsSection results={results} />
    </div>
  );
}

// ❌ AVOID: Recalculating on every render
function CalculatorComponent() {
  const [inputs, setInputs] = useState(initialInputs);
  const results = calculateDesign(inputs); // Called on every render!
  return ...;
}
```

---

## Documentation Standards

### 1. JSDoc Comments

```typescript
/**
 * Calculate rectangular stress block moment capacity
 * 
 * Implements AS 3600 Clause 8.1 flexural design with
 * rectangular stress block assumption and strain compatibility.
 * 
 * @param b - Beam width (mm)
 * @param d - Effective depth (mm)
 * @param Ast - Tensile reinforcement area (mm²)
 * @param fc - Concrete design strength (MPa)
 * @param fsy - Steel design strength (MPa)
 * @param phi - Capacity reduction factor (default: 0.85)
 * 
 * @returns Object containing:
 *   - Mu: Moment capacity (kNm)
 *   - ku: Neutral axis depth ratio
 *   - strain_c: Concrete strain at failure
 * 
 * @example
 * const capacity = calculateMomentCapacity(
 *   300, 500, 1500, 32, 500
 * );
 * console.log(capacity.Mu); // 180 kNm
 * 
 * @throws Error if dimensions invalid
 */
function calculateMomentCapacity(
  b: number,
  d: number,
  Ast: number,
  fc: number,
  fsy: number,
  phi = 0.85
): MomentCapacityResult {
  // Implementation
}
```

### 2. Interface Documentation

```typescript
/**
 * Complete design results for a structural member
 * Combines ULS capacity checks with SLS serviceability verification
 */
interface DesignSummary {
  /** Member identifier string */
  memberId: string;

  /** Design method: Ultimate Limit State or Serviceability */
  designMethod: 'ULS' | 'SLS';

  /** Design inputs used for calculations */
  inputs: DesignInputs;

  /** Ultimate Limit State design results */
  uls: ULSResults;

  /** Serviceability Limit State checks */
  sls: SLSResults;

  /** Standards compliance status */
  compliance: ComplianceStatus;
}
```

### 3. README for Components

```markdown
# DesignInputCard Component

## Purpose
Provides a consistent, professional card container for design input sections.

## Props
- `title` (string): Section title displayed in header
- `description` (string, optional): Descriptive text below title
- `children` (ReactNode): Content to display in card

## Usage
\`\`\`tsx
<DesignInputCard title="Geometry" description="Define member dimensions">
  <GeometryInputs />
</DesignInputCard>
\`\`\`

## Styling
- Applies professional card styling with borders
- Responsive padding and spacing
- Color-coded headers matching design system
```

---

## Debugging & Troubleshooting

### 1. TypeScript Debugging

```bash
# 1. Run type checker with verbose output
npx tsc --noEmit --pretty true

# 2. Check specific file
npx tsc src/components/Calculator.tsx --noEmit

# 3. See all errors (not truncated)
npx tsc --noEmit 2>&1 | head -50
```

### 2. Runtime Debugging

```typescript
// Use descriptive variable names
const momentCapacityKNm = calculateMomentCapacity(inputs);
console.log('Moment capacity:', momentCapacityKNm);

// Log intermediate values
console.log({
  appliedMoment: mStar,
  capacity: momentCapacity,
  ratio: mStar / momentCapacity,
  isSafe: mStar < momentCapacity
});

// Use debugger
debugger;
```

### 3. Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Type error: `Property 'X' not found` | Missing interface property | Verify interface definition |
| Component not rendering | Missing dependencies | Check useMemo/useEffect deps |
| Incorrect calculation | Wrong formula implementation | Verify against standard |
| Export not working | Function not exported | Check export statement |
| Import path error | Wrong alias or path | Use `@/` alias correctly |

---

## Standards References

### Key Standards Documents
- AS 3600:2018 - Concrete Structures Code of Australia
- NCC 2022 - National Construction Code
- AS 1170:2002 - Structural Design Actions

### Online Resources
- [Standards Australia](https://www.standards.org.au/)
- [Australian Building Codes Board](https://www.abcb.gov.au/)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Continuous Learning

### Recommended Reading
1. Read AS 3600 Clause 8 (Design methods)
2. Study NCC Part 3 (Building standards)
3. Review existing calculator implementations
4. Study professional component patterns

### Practice Exercises
1. Implement a new compliance check for new clause
2. Add new material grade to database
3. Create new calculator component
4. Write unit tests for calculation function

---

## Summary

**Key Principles**:
1. ✅ Always use TypeScript strict mode
2. ✅ Follow component composition patterns
3. ✅ Verify standards compliance
4. ✅ Test calculations against standards
5. ✅ Document all public APIs
6. ✅ Optimize performance with memoization
7. ✅ Maintain code organization
8. ✅ Debug methodically with tools

**Quality Gates**:
- 0 TypeScript errors: `npx tsc --noEmit`
- Successful build: `npm run build`
- All tests pass: `npm test`
- Code properly documented: JSDoc on public APIs

---

**Last Updated**: April 21, 2026  
**Version**: 1.0  
**Status**: Complete & Current
