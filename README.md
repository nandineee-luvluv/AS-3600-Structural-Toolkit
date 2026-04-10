# AS 3600 Structural Toolkit

A professional structural design and compliance toolkit for Australian engineers working with concrete structures and building codes.

## Features

- **6 Professional Calculators**
  - Beam Design (flexural & shear analysis)
  - Column Design (axial & biaxial bending)
  - Slab Design (two-way slab analysis)
  - Shear Wall Design
  - Retaining Wall Design
  - Footing Design

- **Standards Compliance**
  - AS 3600:2018 - Concrete Structures Code
  - NCC 2022 - National Construction Code
  - AS 1170:2002 - Load Combinations

- **Professional Features**
  - Material database with concrete & reinforcement properties
  - Section library management
  - Design history tracking
  - Comprehensive compliance checking
  - Export design results (PDF, PNG)
  - Real-time validation & feedback

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Build System**: Vite 6.4.2
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Math Rendering**: KaTeX
- **Export**: html2canvas, PurifyCSS

## Installation

### Prerequisites
- Node.js 18+ or npm 9+
- npm or pnpm package manager

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npx tsc --noEmit
```

## Project Structure

```
src/
├── components/
│   ├── calculators/          # 6 main calculator components
│   │   ├── BeamCalculator.tsx
│   │   ├── ColumnCalculator.tsx
│   │   ├── SlabCalculator.tsx
│   │   ├── WallCalculator.tsx
│   │   ├── FrameCalculator.tsx
│   │   └── RetainingWallCalculator.tsx
│   ├── ui/                   # Professional UI components
│   │   ├── InputGrid.tsx
│   │   ├── MaterialSelector.tsx
│   │   ├── LoadCombinationSelector.tsx
│   │   ├── DesignResultsSummary.tsx
│   │   ├── ProfessionalComponents.tsx
│   │   ├── CalculatorWrappers.tsx
│   │   └── ... (10+ custom components)
│   ├── MaterialSettings.tsx
│   ├── SectionLibraryManager.tsx
│   ├── HistoryView.tsx
│   └── ErrorBoundary.tsx
├── lib/
│   ├── as3600.ts            # AS 3600:2018 compliance engine
│   ├── as1170.ts            # Load combination calculations
│   ├── ncc-compliance.ts    # NCC 2022 compliance checks
│   └── utils.ts
├── contexts/
│   ├── HistoryContext.tsx
│   ├── LoadCombinationContext.tsx
│   ├── MaterialContext.tsx
│   └── SectionContext.tsx
├── hooks/
│   ├── useComposition.ts
│   ├── useMobile.tsx
│   └── usePersistFn.ts
└── App.tsx
```

## Usage

### Running the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:5173` (or another available port).

### Building for Production

```bash
npm run build
```

The optimized production build will be generated in the `dist/` directory.

### Type Checking

```bash
npx tsc --noEmit
```

Verify that all TypeScript types are correct without generating output files.

## Calculators

### Beam Design
Perform flexural and shear design on rectangular beams according to AS 3600:2018. Includes:
- Rectangular stress block analysis
- Strain compatibility considerations
- Crack control checks
- Development length calculations
- Deflection checks

### Column Design
Design columns under axial and biaxial bending. Features:
- Interaction diagram generation
- Slender column considerations
- Biaxial bending analysis
- Reinforcement optimization

### Slab Design
Two-way slab design with:
- Moment coefficient methods
- Edge support conditions
- Deflection limits
- Punching shear checks

### Shear Wall Design
Vertical cantilever wall analysis:
- Flexural design
- Shear design
- Combined loading

### Retaining Wall Design
Gravity and reinforced retaining walls:
- Bearing pressure checks
- Sliding & overturning stability
- Backfill pressure analysis

### Footing Design
Foundation design for various loading:
- One-way shear
- Two-way punching shear
- Settlement estimation

## Standards & Compliance

All calculations comply with:

- **AS 3600:2018** - Australian Standard for Concrete Structures
  - Clause 8.1 - Flexural Design
  - Clause 8.2 - Shear Design
  - Clause 12 - Fire Resistance
  
- **NCC 2022** - National Construction Code
  - Fire safety requirements
  - Durability provisions
  - Material properties
  
- **AS 1170:2002** - Structural Design Actions
  - Load combinations for Ultimate Limit State (ULS)
  - Load combinations for Serviceability Limit State (SLS)

## Export & Reporting

- **PDF Export**: Generate professional design reports
- **PNG Export**: Export calculation results as images
- **Design History**: Track and review all previous designs
- **Compliance Summary**: Comprehensive standards compliance verification

## Development

### Code Quality

```bash
# Type checking
npx tsc --noEmit

# Build validation
npm run build
```

### Key Technologies

- **React 18**: Component-based UI
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tool with Hot Module Replacement
- **KaTeX**: Professional mathematical notation

### Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Apache License 2.0 - See LICENSE file for details

## Contributing

Contributions are welcome. Please ensure:
- TypeScript strict mode compliance
- All tests pass
- Code follows existing patterns
- Standards compliance is maintained

## Support

For issues, questions, or feature requests, please refer to the project documentation in the `/docs` folder.

---

**Latest Build**: Production-ready ✅  
**TypeScript Errors**: 0  
**Standards Compliance**: AS 3600:2018, NCC 2022, AS 1170:2002
