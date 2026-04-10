# Integration Extension Guide

This document provides step-by-step instructions for extending the structured compliance system to the remaining calculators.

## Overview

All calculators follow the same enhancement pattern:
1. Add imports for compliance system
2. Create useMemo for compliance check calculation
3. Add ComplianceChecksDisplay component to results
4. Test and verify

---

## Step-by-Step Guide

### Step 1: Add Imports

Add these lines to the calculator imports section:

```typescript
import { checkStructuralCompliance, type ComplianceCheck } from '../../lib/ncc-compliance';
import { ComplianceChecksDisplay } from '../ui/ComplianceInfo';
```

### Step 2: Create Compliance Checks Calculation

Add this useMemo hook after your other calculations (usually after the "NCC Compliance Calculations" section):

#### For BeamCalculator / ColumnCalculator:
```typescript
const structuralComplianceChecks: ComplianceCheck[] = useMemo(() => {
  return checkStructuralCompliance(
    fc,                           // Concrete strength (MPa)
    fsy,                          // Steel strength (MPa)
    'ULS',                        // Design method
    selectedComboId,              // Load combination ID
    AstMid / (effectiveB * d),   // Reinforcement ratio
    'beam'                        // Element type: 'beam' | 'column' | 'slab' | 'wall' | 'footing'
  );
}, [fc, fsy, selectedComboId, AstMid, effectiveB, d]);
```

#### For SlabCalculator:
```typescript
const structuralComplianceChecks: ComplianceCheck[] = useMemo(() => {
  return checkStructuralCompliance(
    fc,
    fsy,
    'ULS',
    selectedComboId,
    As / (Lx * Ly / 1000),      // Reinforcement ratio (2-way)
    'slab'
  );
}, [fc, fsy, selectedComboId, As, Lx, Ly]);
```

#### For WallCalculator:
```typescript
const structuralComplianceChecks: ComplianceCheck[] = useMemo(() => {
  return checkStructuralCompliance(
    fc,
    fsy,
    'ULS',
    selectedComboId,
    Asv / (tw * Lw),            // Shear reinforcement ratio
    'wall'
  );
}, [fc, fsy, selectedComboId, Asv, tw, Lw]);
```

---

### Step 3: Add UI Component

Find the NCC Compliance section in the results area and add the new display:

```typescript
<InputGroup title="NCC Compliance & Durability">
  <div className="p-4 bg-white space-y-4">
    {/* Existing compliance status display */}
    <div className="flex items-center justify-between p-3 bg-gray-50 border border-line">
      {/* ... existing code ... */}
    </div>

    <div className="space-y-2">
      <ResultRow /* ... existing checks ... */ />
    </div>

    {/* ADD THIS SECTION */}
    <div className="h-px bg-line opacity-20 my-4" />

    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60">
        Structured Compliance Assessment
      </p>
      <ComplianceChecksDisplay 
        checks={structuralComplianceChecks} 
        className="max-h-64 overflow-y-auto" 
      />
    </div>
  </div>
</InputGroup>
```

---

## Checklist for Each Calculator

### ColumnCalculator
- [ ] Add imports (checkStructuralCompliance, ComplianceChecksDisplay)
- [ ] Create useMemo for compliance with 'column' element type
- [ ] Add ComplianceChecksDisplay to NCC Compliance section
- [ ] Test with different column geometries
- [ ] Verify reinforcement ratio calculation

### SlabCalculator
- [ ] Add imports
- [ ] Create useMemo for compliance with 'slab' element type
- [ ] Handle both one-way and two-way slab types
- [ ] Add display component to results
- [ ] Test various slab aspect ratios

### WallCalculator
- [ ] Add imports
- [ ] Create useMemo with 'wall' element type
- [ ] Include shear reinforcement ratio calculation
- [ ] Add display to compliance section
- [ ] Test with different wall heights and thicknesses

### FrameCalculator
- [ ] Add imports
- [ ] Create separate compliance checks for each member type
- [ ] Could check multiple checks per frame element
- [ ] Display compliance for overall frame

### RetainingWallCalculator
- [ ] Add imports
- [ ] Create useMemo with 'wall' element type (or custom)
- [ ] Include earth pressure effects
- [ ] Add display component
- [ ] Test different soil conditions

---

## Key Variables to Obtain

For your calculator, identify these values:

| Variable | Calculator | How to Calculate |
|----------|-----------|------------------|
| `fc` | All | Material input |
| `fsy` | All | Steel grade input |
| `selectedComboId` | All | Load combination selector |
| `elementType` | All | Calculator type ('beam', 'column', etc.) |
| **Reinforcement Ratio** | | |
| Beam/Column | BeamCalculator | `Ast / (b * d)` |
| Slab | SlabCalculator | `As / (Lx * Ly / 1000)` |
| Wall | WallCalculator | `Asv / (tw * Lw)` |
| **Effective Depth** | | |
| Beam/Column | CalcCalc | `h - cover - stirrup - bar/2` |
| Slab | SlabCalculator | Use effective thickness |

---

## Testing Checklist

After implementing, test:

- [ ] Compliance checks display without errors
- [ ] Status colors are correct (green/yellow/red)
- [ ] References to standards are visible
- [ ] Component scrolls if many checks
- [ ] Check messages are clear and actionable
- [ ] No console errors in browser
- [ ] Build still succeeds: `npm run build`
- [ ] Visual consistency maintained (brutal aesthetic)

---

## Common Issues & Solutions

### Issue: "Cannot find module 'ncc-compliance'"
**Solution**: Verify import path is correct:
```typescript
import { checkStructuralCompliance } from '../../lib/ncc-compliance';
```

### Issue: TypeScript errors with ComplianceCheck type
**Solution**: Add type import:
```typescript
import { checkStructuralCompliance, type ComplianceCheck } from '../../lib/ncc-compliance';
```

### Issue: Compliance checks not updating
**Solution**: Ensure all dependencies in useMemo dependency array:
```typescript
}, [fc, fsy, selectedComboId, ast, effectiveWidth, effectiveDepth]);
```

### Issue: Component not displaying
**Solution**: Verify props are passed correctly:
```typescript
<ComplianceChecksDisplay 
  checks={structuralComplianceChecks}  // Must be ComplianceCheck[]
  className="..."
/>
```

---

## Reference Implementation

See `BeamCalculator.tsx` for the complete implemented example:
- Lines ~22-23: Imports
- Lines ~249-258: useMemo calculation
- Lines ~653-683: UI integration

---

## Performance Considerations

- Compliance checks use useMemo to prevent unnecessary recalculation
- Only recalculate when inputs change
- For complex calculators, consider memoizing reinforcement ratio calculation too

---

## Future Enhancements

### Possible additions to compliance system:
1. Seismic design compliance checks
2. Durability class specific validations
3. Fire resistance requirement checks
4. Exposure classification dependent checks
5. Construction sequencing compliance

These can be added to `src/lib/ncc-compliance.ts` without modifying calculators.

---

## Standards References

All compliance checks reference:
- **AS 3600:2018** - Concrete Structures Standard
- **AS 1170** - Load Combinations
- **NCC 2022** - National Construction Code
- **AS 2870** - Residential Slabs (residential calculator)

---

## Questions?

Refer to:
1. INTEGRATION_SUMMARY.md for overview
2. BeamCalculator.tsx for working example
3. ncc-compliance.ts for available check functions
4. ComplianceInfo.tsx for UI component specifications

---

**Last Updated**: April 10, 2026
