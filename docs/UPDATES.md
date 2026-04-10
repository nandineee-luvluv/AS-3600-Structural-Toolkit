# AS 3600 Structural Toolkit - Recent Updates

## Enhanced NCC Compliance & Structured Design Validation (April 2026)
Major enhancement integrating structured compliance checking system with detailed NCC 2022 and AS 3600 validation.

### New Modules Added:
- **`src/lib/ncc-compliance.ts`**: Comprehensive structured compliance system
  - `ComplianceCheck` interface for atomic compliance checks
  - `ComplianceReport` interface for aggregated compliance assessments
  - `checkStructuralCompliance()`: Validates concrete strength, steel grade, design method, load combinations, and reinforcement ratios
  - `checkResidentialCompliance()`: AS 2870 compliance for residential slabs
  - `checkBuildingClassification()`: NCC building class validation
  - Report generation and export functions (text, JSON formats)
  
- **`src/lib/as3600-enhanced.ts`**: Type-safe design helper library
  - Structured interfaces: `ConcreteProperties`, `SteelProperties`, `DesignParameters`
  - Input structures: `BeamDesignInput`, `SlabDesignInput`, `ColumnDesignInput`
  - 13 design helper functions including:
    - Effective depth calculation
    - Factored load combinations (AS 1170)
    - Beam/slab moment and shear capacity
    - Column interaction diagram generation
    - Development length calculation
    - Serviceability checks (deflection, crack width)

### UI Enhancements:
- **Enhanced ComplianceInfo Component**: New `ComplianceChecksDisplay` export
  - Visual compliance status indicators (pass/warning/fail)
  - Detailed check-by-check reporting
  - Color-coded status badges
  - Reference citations to standards
  - Scrollable display for multiple checks

### Calculator Integration:
- **BeamCalculator**: 
  - Integrated structured compliance checks (7-point verification)
  - Added "Structured Compliance Assessment" section in NCC Compliance panel
  - Displays individual check results with standard references
  - Maintains backward compatibility with existing "Three-Pillar" system

### Developer Updates:
- Updated `instructions.md` with guidance on using new compliance and calculation modules
- Added comprehensive type definitions for cleaner, safer code
- Enables standardized compliance reporting across all calculators

### Benefits:
- **Transparent Validation**: Every design decision traced to specific standards
- **Detailed Reporting**: Full compliance checks exportable for documentation
- **Type Safety**: TypeScript interfaces reduce errors and improve IDE support
- **Extensibility**: New standards can be added to compliance module without calculator changes
- **Reusability**: Enhanced functions can be applied to all 6 calculator types

---

## Refined Design Procedures & AS 3600 Tuning
Significant enhancements have been made to the core calculation engine to align with professional engineering spreadsheet logic and detailed AS 3600 requirements.

### Key Enhancements:
- **General Method for Shear (Clause 8.2.4.2)**:
    - Replaced simplified shear calculations with the more accurate General Method.
    - Calculates crack control parameters ($k_v, \theta$) based on longitudinal strain ($\varepsilon_x$) and maximum aggregate size.
    - Provides detailed output for shear parameters in the design summary.
- **Serviceability & Crack Control (Clause 8.6 & 9.4.1)**:
    - Integrated deemed-to-comply checks for bar spacing and diameter based on calculated steel stress under service loads.
    - Added support for exposure-class dependent crack control limits.
- **Minimum Reinforcement (Clause 8.1.6.1 & 9.1.1)**:
    - Implemented the full AS 3600 formula for $A_{st,min}$, replacing simplified percentage-based approximations.
    - Considers concrete flexural tensile strength ($f'_{ct.f}$) and section geometry ($h/d$ ratio).
- **Development Length Utility (Clause 13.1)**:
    - Added automatic calculation of required development length ($L_{sy,t}$) for tensile reinforcement.
    - Helps ensure detailing compliance for all structural members.
- **NCC Compliance Summary**:
    - Expanded the NCC compliance section to explicitly report on refined checks like crack control and minimum reinforcement.
    - Updated design reports to include detailed shear parameters ($k_v, \theta, \varepsilon_x$).

## Slab Design Module Enhancements
The Slab Design module has been significantly upgraded to support a wider range of reinforced concrete elements.

### New Features:
- **Two-Way Slab Design**: Added support for two-way slabs with automatic moment coefficient calculations based on aspect ratio ($L_y/L_x$) and support conditions.
- **Waffle Slab Analysis**: Integrated T-beam analysis for waffle slabs, including custom rib spacing, rib width, and topping thickness inputs.
- **Footing & Mat Foundations**:
    - **Bearing Pressure Check**: Calculates average, maximum, and minimum soil bearing pressures.
    - **One-Way Shear**: Implemented Clause 13.4 shear checks for footings at the critical section ($d$ from column face).
    - **Punching Shear**: Enhanced punching shear checks for foundation elements.
- **Integrated Section Library**: The Section Library is now accessible directly within the Slab Design tab, allowing users to save and load slab presets.
- **Dynamic Visualizations**: Real-time SVG diagrams that adapt to the selected slab type (One-Way, Two-Way, Waffle, or Footing).
- **Design Summary Card**: Provides an immediate overview of critical design ratios (Flexure, Punching, and Bearing).
- **Flat Plate Strip Design**: Added strip-based moment distribution for flat plate slabs, calculating Column Strip and Middle Strip moments (Clause 6.10).

## Material Database Updates
- **Expanded Reinforcement Types**: Added support for a wider range of steel types:
    - **Standard Rebars**: Grade 250N, 500N, 500L.
    - **Alloy Rebars**: Stainless Steel Grade 500 and 600.
    - **Cables (Strands)**: High-strength prestressing cables Grade 1750 and 1860.
- **Custom Material Creation**: Users can now add their own concrete mixes and steel grades to a persistent local database.
- **Improved Material Selector**: Dropdown now shows descriptive labels for reinforcement types, including their yield strength ($f_{sy}$).
- **Updated Design Procedures**: All exported reports now explicitly state the selected reinforcement type and its properties.

## Developer Documentation
- **Instructions Guide**: Created `instructions.md` to guide future development and maintain architectural consistency.

## NCC Compliance & Multi-Standard Integration
- **NCC 2022 Compliance**: Integrated Performance Requirements B1.1 (Structural Reliability) and B1.2 (Structural Resistance) into the design workflow.
- **Durability & Fire Rating**: Added explicit checks for Exposure Classification (AS 3600 Clause 4.3) and Fire Resistance Period (AS 3600 Section 5).
- **Load Combinations (AS 1170.0)**: Refined load combination logic to ensure full compliance with NCC Deemed-to-Satisfy (DTS) provisions.
- **Minimum Cover & Dimensions**: Automated checks for minimum concrete cover and section dimensions based on durability and fire safety requirements.
- **Compliance Summary**: Added a dedicated "NCC Compliance & Durability" section to all design reports, providing a clear pass/fail status for structural, fire, and durability criteria.

## UI and Graphics Overhaul
- **Wider Application Layout**: Increased the main content area width to **1400px** to provide a more professional, desktop-first workspace for technical data.
- **Improved Input Visibility**: Increased input field widths to **128px** and tooltip widths to **320px** to prevent text truncation and improve readability of complex equations.
- **Zone-Based Reinforcement Tabs**: Replaced congested grid layouts with a clean tabbed interface (I-End, Middle, J-End) for reinforcement inputs in all calculators.
- **Longitudinal Visualizations**: Added longitudinal section views for beams and columns, and elevation views for walls, showing reinforcement zones and bar layouts.
- **Manual Moment Overrides**: Added inputs for end moments (M* I-End, M* J-End) in the Beam Calculator, with auto-calculation as a default.
- **Interactive Feedback**: The active zone in reinforcement inputs is now visually highlighted in the corresponding diagram.

## Zone-Based Design Enhancements
- **Beam Design**: Fully separated reinforcement inputs (Tensile Bars, Compression Bars, Stirrup Spacing) for I-End, Middle, and J-End zones.
- **Wall Design**: Separated both **Horizontal** and **Vertical reinforcement spacing** into I-End, Middle, and J-End zones, allowing for precise detailing of boundary elements.
- **Column & Wall Design**: Added zone-based shear reinforcement inputs and capacity checks. Users can now define end-zone lengths and specific stirrup/horizontal bar spacings for critical regions.
- **Design Summary Reports**: Updated results sections to provide a clear breakdown of performance across all three design zones.

### Bug Fixes & Stability:
- **Stale Data Handling**: Fixed a critical issue where the application would crash if the user had older data in `localStorage` that lacked the new `slabs` key.
- **Context Safety**: Added guards for load combinations and end conditions to prevent runtime errors if data is missing or incomplete.
- **UI Refinement**: Improved the layout and responsiveness of the calculator for a better engineering workflow.

## Library Updates (`as3600.ts`)
- Added `calculateTwoWaySlabMoments` for aspect-ratio based design.
- Added `calculateBearingPressure` for foundation analysis.
- Added `calculateFootingOneWayShear` for Clause 13.4 compliance.
- Expanded `SECTION_LIBRARY` with default slab and footing presets.
