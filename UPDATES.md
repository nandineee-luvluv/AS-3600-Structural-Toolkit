# AS 3600 Structural Toolkit - Recent Updates

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
