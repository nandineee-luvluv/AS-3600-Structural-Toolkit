# AS 3600 Structural Toolkit - Developer Instructions

## Project Overview
This toolkit is a specialized structural engineering application based on the **AS 3600:2018** Australian Standard for Concrete Structures. It provides calculators for beams, columns, slabs, and walls.

## Core Architecture
- **Framework**: React 18+ with Vite.
- **Styling**: Tailwind CSS with a "Brutalist" aesthetic (heavy borders, mono fonts, high contrast).
- **State Management**: React Context API for cross-cutting concerns (History, Load Combinations, Sections, Materials).
- **Calculation Engine**: `src/lib/as3600.ts` contains the pure mathematical logic for structural analysis.

## Key Modules
### 1. Calculation Library (`src/lib/as3600.ts`)
- All structural logic must reside here.
- Use standard SI units (mm, N, MPa, kNm).
- Follow AS 3600 clause numbering in comments.

### 2. Slabs Module (`src/components/calculators/SlabCalculator.tsx`)
- Supports One-Way, Two-Way, Waffle, Footing, and **Flat Plate** design.
- **Flat Plate**: Uses a strip-based design method (Column/Middle strips).

### 3. Material Database
- Managed via `MaterialContext.tsx`.
- Supports default AS 3600 grades and user-defined custom materials.

### 4. Zone-Based Design
- **Beams**: Design is performed at three critical sections (I-end, Middle, J-end). Zones are fixed at L/3.
- **Columns/Walls**: Shear design is performed at three zones. End-zone lengths are configurable.
- **Calculations**: Use `calculateShearCapacity` and `calculateFlexuralCapacity` for each zone independently.

### 5. NCC Compliance & Refined Design
- **Standards**: The toolkit integrates AS 3600 (Concrete), AS 1170 (Loads), and NCC 2022 requirements.
- **Refined Procedures**:
    - **Shear**: Uses the General Method (Clause 8.2.4.2) for beams, considering strain compatibility.
    - **Crack Control**: Deemed-to-comply checks for bar spacing and diameter (Clause 8.6).
    - **Min Reinforcement**: Accurate $A_{st,min}$ calculation based on $f'_{ct.f}$.
    - **Detailing**: Automatic calculation of development lengths ($L_{sy,t}$).
- **Compliance Logic**: Every calculator must perform a three-pillar compliance check:
    1. **Structural Safety**: Strength checks against factored loads.
    2. **Fire Resistance**: Minimum dimensions and cover for the specified FRP.
    3. **Durability**: Minimum cover for the specified Exposure Classification.
- **NCC Status**: The `checkNCCCompliance` utility in `as3600.ts` provides the final verification status.

## Development Guidelines
- **Visual Consistency**: Always use the `brutal-card` class and `InputGroup`/`InputField` components for UI consistency.
- **Units**: Clearly label all inputs and outputs with units.
- **Validation**: Use the `validateInput` utility to prevent non-physical inputs.
- **Documentation**: Update `UPDATES.md` for every major feature and `instructions.md` for architectural changes.

### UI & Graphics Standards
- **Wider Layout**: The application uses a `max-w-[1400px]` container to provide ample space for technical inputs and graphical results.
- **Input Sizing**: Standard `InputField` components use a `w-32` (128px) input width to prevent truncation of engineering values.
- **Zone-Based Inputs**: Use a tabbed interface for elements with multiple design zones (e.g., I-End, Mid, J-End) to avoid UI congestion.
- **Visualizations**: Every calculator should include both a cross-section and a longitudinal/elevation view.
- **Interactive Highlighting**: Use the `activeZone` state to highlight the relevant part of the visualization when a user is editing zone-specific inputs.
- **Brutal Design**: Maintain the "Brutal/Technical" aesthetic with high-contrast borders, mono fonts, and grid backgrounds.

## Adding New Features
1.  **Logic**: Add the mathematical function to `as3600.ts`.
2.  **Context**: If the feature requires persistent data, update the relevant Context.
3.  **UI**: Create or update the calculator component.
4.  **Verification**: Run `npm run lint` and `npm run build` before finalizing.
