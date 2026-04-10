import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { calculateSlabMoments, calculateBeamReinforcement, DesignParameters } from '@/lib/as3600-enhanced';
import { checkStructuralCompliance, generateComplianceReport } from '@/lib/ncc-compliance';

interface SlabDesignState {
  // Geometry
  lx: number; // shorter span
  ly: number; // longer span
  thickness: number;
  cover: number;

  // Loads
  deadLoad: number;
  liveLoad: number;
  loadType: 'residential' | 'office' | 'retail' | 'industrial';

  // Materials
  concreteGrade: number;
  steelGrade: number;

  // Results
  results: any;
  compliance: any;
}

export default function SlabCalculator() {
  const [state, setState] = useState<SlabDesignState>({
    lx: 4000,
    ly: 6000,
    thickness: 150,
    cover: 25,
    deadLoad: 5,
    liveLoad: 2.5,
    loadType: 'residential',
    concreteGrade: 25,
    steelGrade: 500,
    results: null,
    compliance: null,
  });

  const [activeTab, setActiveTab] = useState('inputs');

  const loadTypeValues: Record<string, number> = {
    residential: 1.5,
    office: 2.5,
    retail: 3.5,
    industrial: 5.0,
  };

  const handleInputChange = (field: string, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const performCalculation = () => {
    // Apply load type multiplier to live load
    const effectiveLiveLoad = state.liveLoad * (loadTypeValues[state.loadType] / 2.5);
    const totalLoad = 1.2 * state.deadLoad + 1.5 * effectiveLiveLoad; // ULS load

    // Design parameters
    const parameters: DesignParameters = {
      concrete: {
        fck: state.concreteGrade,
        fc: 0.85 * state.concreteGrade,
        Ec: 5000 * Math.sqrt(state.concreteGrade),
        epsilonCu: 0.003,
      },
      steel: {
        fyk: state.steelGrade,
        fy: 0.87 * state.steelGrade,
        Es: 200000,
        epsilonSu: 0.05,
      },
      phiFactor: 0.8,
      cover: state.cover,
    };

    // Calculate effective depth
    const d = state.thickness - state.cover - 6; // Assuming 6mm bars

    // Calculate moments using two-way slab method
    const moments = calculateSlabMoments(state.lx, state.ly, state.thickness, totalLoad, parameters);

    // Calculate reinforcement for both directions
    const reinforcementX = calculateBeamReinforcement(1000, d, moments.mx, parameters);
    const reinforcementY = calculateBeamReinforcement(1000, d, moments.my, parameters);

    // Calculate minimum reinforcement for slabs
    const minReinforcement = 0.0012 * 1000 * d;

    // Determine bar spacing based on reinforcement
    const spacingX = (1000 * 28.27) / reinforcementX.Ast; // Assuming 6mm bars
    const spacingY = (1000 * 28.27) / reinforcementY.Ast;

    // Check deflection (simplified)
    const spanDepthRatio = state.lx / state.thickness;
    const limitSpanDepth = 35; // For residential slabs

    const results = {
      effectiveLiveLoad,
      totalLoad,
      moments,
      d,
      reinforcementX,
      reinforcementY,
      minReinforcement,
      spacingX: Math.min(spacingX, 300), // Max spacing 300mm
      spacingY: Math.min(spacingY, 300),
      spanDepthRatio,
      limitSpanDepth,
      deflectionCompliant: spanDepthRatio <= limitSpanDepth,
    };

    // Check compliance
    const complianceChecks = checkStructuralCompliance(
      state.concreteGrade,
      state.steelGrade,
      'ULS',
      '1.2G + 1.5Q',
      (reinforcementX.ratio + reinforcementY.ratio) / 2,
      'slab'
    );

    // Add slab-specific checks
    if (state.thickness < 100) {
      complianceChecks.push({
        standard: 'AS 3600',
        clause: '6.10',
        requirement: 'Minimum slab thickness',
        status: 'fail',
        message: `Slab thickness ${state.thickness} mm is below minimum 100 mm for typical slabs`,
        reference: 'AS 3600:2018 Clause 6.10',
      });
    }

    if (state.lx / state.ly > 2) {
      complianceChecks.push({
        standard: 'AS 3600',
        clause: '6.10',
        requirement: 'Span ratio',
        status: 'warning',
        message: `Span ratio ${(state.ly / state.lx).toFixed(2)} suggests one-way slab behavior. Consider one-way slab design.`,
        reference: 'AS 3600:2018 Clause 6.10',
      });
    }

    const compliance = generateComplianceReport('Slab Design', 'Reinforced Concrete Slab', complianceChecks);

    setState((prev) => ({ ...prev, results, compliance }));
    setActiveTab('results');
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inputs" className="text-xs sm:text-sm">
            Inputs
          </TabsTrigger>
          <TabsTrigger value="calc" className="text-xs sm:text-sm">
            Calc
          </TabsTrigger>
          <TabsTrigger value="results" className="text-xs sm:text-sm">
            Results
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs sm:text-sm">
            Compliance
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs sm:text-sm">
            Export
          </TabsTrigger>
        </TabsList>

        {/* Inputs Tab */}
        <TabsContent value="inputs" className="space-y-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Stage 1: Slab Design Parameters</p>
                <p className="text-blue-800 mt-1">Enter slab geometry, loads, and material properties</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Geometry Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Slab Geometry</CardTitle>
                <CardDescription>Dimensions in millimeters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Shorter Span Lx (mm)</label>
                    <input
                      type="number"
                      value={state.lx}
                      onChange={(e) => handleInputChange('lx', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Longer Span Ly (mm)</label>
                    <input
                      type="number"
                      value={state.ly}
                      onChange={(e) => handleInputChange('ly', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Thickness (mm)</label>
                    <input
                      type="number"
                      value={state.thickness}
                      onChange={(e) => handleInputChange('thickness', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Cover (mm)</label>
                    <input
                      type="number"
                      value={state.cover}
                      onChange={(e) => handleInputChange('cover', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loads Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Design Loads</CardTitle>
                <CardDescription>Loads in kN/m² (per AS 1170)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Dead Load (kN/m²)</label>
                    <input
                      type="number"
                      value={state.deadLoad}
                      onChange={(e) => handleInputChange('deadLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Live Load (kN/m²)</label>
                    <input
                      type="number"
                      value={state.liveLoad}
                      onChange={(e) => handleInputChange('liveLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Load Type</label>
                  <select
                    value={state.loadType}
                    onChange={(e) => handleInputChange('loadType', e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="residential">Residential</option>
                    <option value="office">Office</option>
                    <option value="retail">Retail</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Materials Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Concrete Grade (MPa)</label>
                    <select
                      value={state.concreteGrade}
                      onChange={(e) => handleInputChange('concreteGrade', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={20}>20 MPa</option>
                      <option value={25}>25 MPa</option>
                      <option value={30}>30 MPa</option>
                      <option value={40}>40 MPa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Steel Grade (MPa)</label>
                    <select
                      value={state.steelGrade}
                      onChange={(e) => handleInputChange('steelGrade', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value={250}>250 MPa</option>
                      <option value={300}>300 MPa</option>
                      <option value={500}>500 MPa</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={performCalculation} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Calculate Slab Design
            </Button>
          </div>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calc" className="space-y-4 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Stage 2: Calculation Steps</p>
                <p className="text-amber-800 mt-1">Two-way slab moment distribution and reinforcement</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Load Analysis</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Dead Load: {state.deadLoad.toFixed(2)} kN/m²</div>
                    <div>Live Load (effective): {state.results.effectiveLiveLoad.toFixed(2)} kN/m²</div>
                    <div>Total ULS Load: {state.results.totalLoad.toFixed(2)} kN/m²</div>
                    <div>Span Ratio (Ly/Lx): {(state.ly / state.lx).toFixed(2)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Design Moments</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>Moment in X: {state.results.moments.mx.toFixed(2)} kN.m/m</div>
                    <div>Moment in Y: {state.results.moments.my.toFixed(2)} kN.m/m</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Click Calculate to see calculation steps</p>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold">Stage 3: Reinforcement Design</p>
                <p className="text-green-800 mt-1">Required reinforcement in both directions</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reinforcement Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">X-Direction (Shorter Span)</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.reinforcementX.Ast.toFixed(0)} mm²/m</p>
                      <p className="text-xs text-muted-foreground mt-1">Spacing: {state.results.spacingX.toFixed(0)} mm</p>
                    </div>
                    <div className="p-3 bg-secondary rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Y-Direction (Longer Span)</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.reinforcementY.Ast.toFixed(0)} mm²/m</p>
                      <p className="text-xs text-muted-foreground mt-1">Spacing: {state.results.spacingY.toFixed(0)} mm</p>
                    </div>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Minimum Reinforcement</p>
                    <p className="text-lg font-semibold text-foreground">{state.results.minReinforcement.toFixed(0)} mm²/m</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Deflection Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Span/Depth Ratio</p>
                      <p className="text-lg font-semibold">{state.results.spanDepthRatio.toFixed(1)} / {state.results.limitSpanDepth}</p>
                    </div>
                    {state.results.deflectionCompliant ? (
                      <Badge className="bg-green-100 text-green-800">✓ OK</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">✗ Increase Thickness</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Results will appear here after calculation</p>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold">Stage 4: Compliance Verification</p>
                <p className="text-blue-800 mt-1">AS 3600 and NCC compliance checks</p>
              </div>
            </div>
          </div>

          {state.compliance ? (
            <div className="space-y-3">
              {state.compliance.checks.map((check: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {check.status === 'pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{check.standard} - {check.clause}</span>
                          <Badge
                            variant="outline"
                            className={
                              check.status === 'pass'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }
                          >
                            {check.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{check.requirement}</p>
                        <p className="text-sm">{check.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Compliance checks will appear here after calculation</p>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4 mt-6">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-semibold">Stage 5: Export & Documentation</p>
                <p className="text-purple-800 mt-1">Generate reports and design documentation</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start">
              Export PDF Report
            </Button>
            <Button variant="outline" className="justify-start">
              Reinforcement Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              Compliance Certificate
            </Button>
            <Button variant="outline" className="justify-start">
              Design Assumptions
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
