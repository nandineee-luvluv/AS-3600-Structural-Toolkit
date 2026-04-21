# Development Guide & API Reference

**API documentation, setup instructions, and development best practices for the AS-3600 Structural Toolkit.**

---

## Part 1: Quick API Reference

### NCC Compliance Module (`src/lib/ncc-compliance.ts`)

#### Interfaces

```typescript
interface ComplianceCheck {
  standard: string;              // e.g., "NCC 2022"
  clause: string;                // e.g., "Part 3.2"
  requirement: string;           // Human-readable requirement
  status: 'pass' | 'fail' | 'warning';
  message: string;               // Detailed explanation
  reference?: string;            // Optional standard reference
}

interface ComplianceReport {
  projectName: string;
  elementType: string;
  checks: ComplianceCheck[];
  overallCompliant: boolean;
  timestamp: Date;
}
```

#### Core Functions

```typescript
// Structural compliance checking
function checkStructuralCompliance(
  fc: number,                    // Concrete strength (MPa)
  fsy: number,                   // Steel strength (MPa)
  designMethod: 'ULS' | 'SLS',
  loadCombination: string,       // e.g., '1.2G + 1.5Q'
  reinforcementRatio: number,    // Ast / (b × d)
  elementType: string            // 'beam', 'column', 'slab', 'wall'
): ComplianceCheck[]

// Residential slab compliance
function checkResidentialCompliance(
  slabThickness: number,
  concreteStrength: number,
  soilBearingCapacity: number,
  designMethod: string
): ComplianceCheck[]

// Building classification
function checkBuildingClassification(
  buildingClass: string,
  fireRating: string,
  constructionType: string
): ComplianceCheck[]

// Report generation
function generateComplianceReport(
  checks: ComplianceCheck[],
  projectInfo: ProjectInfo
): ComplianceReport

// Formatting functions
function formatComplianceReport(report: ComplianceReport): string
function exportComplianceJSON(report: ComplianceReport): string
```

### Enhanced Design Library (`src/lib/as3600-enhanced.ts`)

#### Interfaces

```typescript
interface ConcreteProperties {
  fck: number;        // Characteristic strength
  fc: number;         // Design strength
  Ec: number;         // Elastic modulus
  epsilonCu: number;  // Ultimate strain
}

interface SteelProperties {
  fyk: number;        // Characteristic yield
  fyd: number;        // Design yield
  Es: number;         // Elastic modulus (typically 200,000)
  epsilonY: number;   // Yield strain
}

interface DesignParameters {
  concrete: ConcreteProperties;
  steel: SteelProperties;
  phiFactor: number;  // Capacity reduction factor
  cover: number;      // Concrete cover (mm)
}

interface BeamDesignInput {
  shape: 'rectangular' | 'tee' | 'ell';
  b: number;          // Width (mm)
  d: number;          // Effective depth (mm)
  h: number;          // Total depth (mm)
  Ast: number;        // Tensile reinforcement (mm²)
  Asc?: number;       // Compression reinforcement (mm²)
  dc: number;         // Compression cover (mm)
}
```

#### Design Helper Functions

```typescript
// Material properties
function getConcreteDesignStrength(fc: number, alpha2: number): number
function getSteelDesignStrength(fsy: number): number
function calculateConcreteElasticModulus(fc: number): number

// Section analysis
function calculateEffectiveDepth(
  h: number,          // Total depth
  cover: number,      // Concrete cover
  stirrupDiam: number,
  barDiam: number
): number

// Load combinations (AS 1170)
function calculateFactoredLoads(
  deadLoad: number,
  liveLoad: number,
  windLoad?: number,
  seismicLoad?: number
): { uls: number, sls: number }

// Design calculations
function calculateBeamMomentCapacity(
  input: BeamDesignInput,
  parameters: DesignParameters
): { Mu: number, ku: number, strain_c: number }

function calculateBeamShearCapacity(
  input: BeamDesignInput,
  parameters: DesignParameters,
  M_star: number,
  V_star: number,
  Asv: number,
  spacing: number
): { Vu: number, Vc: number, Vs: number }

function calculateBeamReinforcement(
  b: number,
  d: number,
  M_star: number,
  parameters: DesignParameters
): { required: number, min: number, max: number }

// Two-way slabs
function calculateSlabMoments(
  Lx: number,         // Short span
  Ly: number,         // Long span
  loadPerUnit: number,
  supportConditions: string
): { Mx: number, My: number }

// Columns
function calculateColumnInteractionDiagram(
  input: ColumnDesignInput,
  parameters: DesignParameters
): InteractionDiagramPoint[]

// Minimum reinforcement
function calculateMinimumReinforcement(
  b: number,
  d: number,
  fc: number,
  fsy: number
): number

// Development length
function calculateDevelopmentLength(
  barDiam: number,
  fsy: number,
  fc: number
): number

// Serviceability
function checkDeflection(
  span: number,
  depth: number,
  reinforcementRatio: number,
  load: number
): { actual: number, limit: number, safe: boolean }

function checkCrackWidth(
  cover: number,
  barDiam: number,
  spacing: number,
  steelStress: number,
  exposureClass: string
): { actual: number, limit: number, safe: boolean }
```

### Professional Design Engine (`src/lib/professional-design-engine.ts`)

#### Key Functions

```typescript
function calculateRectangularStressBlockMoment(
  b: number,
  d: number,
  Ast: number,
  fc: number,
  fsy: number,
  phi?: number
): { Mu: number, ku: number, strain_c: number }

function calculateShearCapacityGeneralMethod(
  b: number,
  d: number,
  M_star: number,
  V_star: number,
  Ast: number,
  Asv: number,
  spacing: number,
  fc: number,
  fsy: number
): { Vu: number, kv: number, theta: number, epsilon_x: number }

function generateDesignReport(
  designState: DesignState,
  standards: string[]
): DesignReport

function calculateEffectiveWidth(
  shape: string,
  dimensions: any
): number
```

---

## Part 2: Installation & Setup

### Prerequisites

- Node.js 18+ or npm 9+
- TypeScript 4.9+

### Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Set environment variables (if needed)
cp .env.example .env.local
# Edit .env.local with your settings

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

### Build Commands

```bash
# Development server with hot reload
npm run dev

# Type checking
npx tsc --noEmit

# Production build
npm run build

# Build preview
npm run preview
```

---

## Part 3: Project Structure

```
src/
├── components/
│   ├── calculators/        # 6 design calculators
│   │   ├── BeamCalculator.tsx
│   │   ├── ColumnCalculator.tsx
│   │   ├── SlabCalculator.tsx
│   │   ├── WallCalculator.tsx
│   │   ├── FrameCalculator.tsx
│   │   └── RetainingWallCalculator.tsx
│   ├── ui/                 # Professional UI components
│   │   ├── ProfessionalComponents.tsx (9 components)
│   │   ├── DesignResultsSummary.tsx (5-tab interface)
│   │   ├── MaterialDatabase.tsx (9 grades)
│   │   ├── CalculatorWrappers.tsx (6 wrappers)
│   │   ├── ComplianceInfo.tsx
│   │   ├── ExportActions.tsx
│   │   └── ... (40+ additional components)
│   ├── MaterialSettings.tsx
│   ├── HistoryView.tsx
│   ├── SectionLibraryManager.tsx
│   └── ErrorBoundary.tsx
├── lib/
│   ├── ncc-compliance.ts   (350+ lines, 6 functions)
│   ├── as3600-enhanced.ts  (450+ lines, 13 functions)
│   ├── professional-design-engine.ts (400+ lines)
│   ├── as3600.ts           (Core calculations)
│   ├── as1170.ts           (Load combinations)
│   ├── exportUtils.ts      (PDF/Python export)
│   └── utils.ts            (Helper functions)
├── contexts/
│   ├── HistoryContext.tsx
│   ├── LoadCombinationContext.tsx
│   ├── MaterialContext.tsx
│   └── SectionContext.tsx
├── hooks/
│   ├── useComposition.ts
│   ├── useMobile.tsx
│   └── usePersistFn.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## Part 4: Development Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Code Style Guidelines

1. **Component Organization**:
   - Functional components preferred
   - Use hooks for state management
   - Extract complex logic to custom hooks

2. **Type Safety**:
   - All props should be typed
   - Use interfaces for complex objects
   - Avoid `any` type

3. **Naming Conventions**:
   - Components: PascalCase
   - Functions: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Files: match component name

4. **Performance**:
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers
   - Avoid unnecessary re-renders

### Example Component Structure

```typescript
import React, { useState, useMemo } from 'react';

interface ComponentProps {
  title: string;
  value: number;
  onChange: (value: number) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({
  title,
  value,
  onChange
}) => {
  const [state, setState] = useState(value);

  const processed = useMemo(() => {
    return expensive_calculation(state);
  }, [state]);

  return (
    <div>
      <h2>{title}</h2>
      <p>{processed}</p>
    </div>
  );
};
```

---

## Part 5: Standards & Compliance

### Supported Standards

- **AS 3600:2018** - Concrete Structures
  - Clause 2: Material properties
  - Clause 6: Geometric properties
  - Clause 8: Strength design
  - Clause 9: Serviceability
  - Clause 12: Bond and anchorage
  - Clause 13: Detailing

- **NCC 2022** - National Construction Code
  - Part 3.2: Structural design
  - Part 3.3: Fire resistance
  - Part 3.4: Durability

- **AS 1170:2002** - Structural Design Actions
  - Load cases and combinations
  - Factor derivation
  - Serviceability limits

### Material Database

**Concrete Grades** (7 total):
- C20: fc = 20 MPa, fcd = 12 MPa (α₂ = 0.67)
- C25, C32, C40, C50, C60, C80

**Steel Grades** (2 total):
- N500: fsy = 500 MPa, fyd = 435 MPa (0.87 × 500)
- N600: fsy = 600 MPa, fyd = 522 MPa (0.87 × 600)

---

## Part 6: Changelog & Version History

### April 2026 - Enhanced NCC Compliance & Structured Validation

**New Modules**:
- `ncc-compliance.ts`: Structured compliance checking
- `as3600-enhanced.ts`: Type-safe design helpers
- Enhanced `ComplianceInfo.tsx`: Visual compliance display

**Improvements**:
- General Method shear design (Clause 8.2.4.2)
- Serviceability & crack control (Clause 9.4.1)
- Minimum reinforcement per full AS 3600 formula
- Development length calculations
- NCC compliance summary expansion

**Slab Enhancements**:
- Two-way slab design with moment coefficients
- Waffle slab analysis
- Footing & mat foundation support
- Punching shear checks
- Bearing pressure calculations
- Flat plate strip design

**Material Updates**:
- Expanded reinforcement types (Grade 250N, 500N, 500L)
- Alloy rebars (Stainless Steel)
- Cables/strands (High-strength prestressing)
- Custom material creation
- Persistent local database

---

## Part 7: Design Concepts

### Three Design Approaches

#### 1. Technical Precision Design
- Monochromatic with strategic accent colors
- Information density without clutter
- Nested sections reveal detail progressively
- Functional minimalism

#### 2. Collaborative Design
- Warm, inviting interface
- Design review and annotation
- Visual storytelling approach
- Progressive reveal of information

#### 3. Iterative Refinement Design
- Modern minimalist approach
- Focus on calculation logic
- Extensible component architecture
- Power user optimization

### Color Philosophy
- Structural blue (#2563eb) for primary accent
- Structural green (#059669) for success states
- Warning amber (#f59e0b) for critical values
- Deep slate (#1a2332) for structure

---

## Part 8: Troubleshooting

### Build Issues

**Issue**: `npm install` fails
```bash
# Solution: Clear npm cache
npm cache clean --force
npm install
```

**Issue**: TypeScript errors during build
```bash
# Solution: Type check first
npx tsc --noEmit
# Fix errors, then build
npm run build
```

### Development Issues

**Issue**: Changes not reflecting in browser
```bash
# Solution: Clear browser cache and restart
npm run dev  # Fresh development server
```

**Issue**: Module not found errors
```bash
# Check import paths
# Correct: @/components/ui/Component
# Check baseUrl in tsconfig.json
```

---

## Part 9: Best Practices

1. **Always use TypeScript interfaces** for complex data
2. **Use useMemo** for expensive calculations
3. **Import from proper module paths** (use @ alias)
4. **Test TypeScript compilation** before building
5. **Follow naming conventions** for consistency
6. **Document complex functions** with JSDoc
7. **Use professional components** instead of basic HTML
8. **Implement compliance checking** for all calculators
9. **Export design results** in multiple formats
10. **Follow accessibility standards** (WCAG)

---

## Part 10: Resources & References

- **AS 3600:2018**: Australian Standard for Concrete Structures
- **NCC 2022**: National Construction Code of Australia
- **AS 1170:2002**: Structural Design Actions
- **React Documentation**: https://react.dev
- **TypeScript Handbook**: https://www.typescriptlang.org/docs
- **Tailwind CSS**: https://tailwindcss.com

---

**Last Updated**: April 21, 2026  
**Status**: Complete & Current
