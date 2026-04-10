import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Download } from 'lucide-react';
import {
  calculateFactoredLoads,
  calculateBeamMomentCapacity,
  calculateBeamShearCapacity,
  calculateBeamReinforcement,
  calculateMinimumReinforcement,
  calculateDevelopmentLength,
  checkDeflection,
  checkCrackWidth,
  DesignParameters,
} from '@/lib/as3600-enhanced';
import { checkStructuralCompliance, generateComplianceReport } from '@/lib/ncc-compliance';

interface BeamDesignState {
  // Geometry
  length: number;
  width: number;
  depth: number;
  cover: number;

  // Loads
  deadLoad: number;
  liveLoad: number;
  windLoad: number;
  earthquakeLoad: number;

  // Materials
  concreteGrade: number;
  steelGrade: number;

  // Results
  results: any;
  compliance: any;
}

export default function BeamCalculatorEnhanced() {
  const [state, setState] = useState<BeamDesignState>({
    length: 5000,
    width: 300,
    depth: 500,
    cover: 40,
    deadLoad: 15,
    liveLoad: 5,
    windLoad: 0,
    earthquakeLoad: 0,
    concreteGrade: 30,
    steelGrade: 500,
    results: null,
    compliance: null,
  });

  const [activeTab, setActiveTab] = useState('inputs');

  const handleInputChange = (field: string, value: any) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const performCalculation = () => {
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

    // Calculate factored loads
    const loads = calculateFactoredLoads(
      state.deadLoad,
      state.liveLoad,
      state.windLoad,
      state.earthquakeLoad
    );

    // Calculate effective depth
    const d = state.depth - state.cover - 8 - 12 / 2; // Assuming 8mm stirrups and 12mm bars

    // Calculate moment (simplified - assume simply supported)
    const Mu = (loads.maximum * Math.pow(state.length / 1000, 2)) / 8; // kN.m

    // Calculate moment capacity
    const momentCapacity = calculateBeamMomentCapacity(state.width, d, 1000, parameters);

    // Calculate required reinforcement
    const reinforcement = calculateBeamReinforcement(state.width, d, Mu, parameters);

    // Calculate shear capacity
    const shearCapacity = calculateBeamShearCapacity(state.width, d, 100, 200, parameters);

    // Calculate minimum reinforcement
    const minReinforcement = calculateMinimumReinforcement(state.width, d, state.concreteGrade);

    // Check deflection
    const deflectionCheck = checkDeflection(state.length, state.depth, reinforcement.ratio, state.concreteGrade);

    // Check crack width
    const crackCheck = checkCrackWidth(12, 200, state.concreteGrade, reinforcement.ratio);

    // Calculate development length
    const devLength = calculateDevelopmentLength(12, state.steelGrade, state.concreteGrade);

    const results = {
      loads,
      Mu,
      momentCapacity,
      reinforcement,
      shearCapacity,
      minReinforcement,
      deflectionCheck,
      crackCheck,
      devLength,
      effectiveDepth: d,
    };

    // Check compliance
    const complianceChecks = checkStructuralCompliance(
      state.concreteGrade,
      state.steelGrade,
      'ULS',
      `1.2G + 1.5Q`,
      reinforcement.ratio,
      'beam'
    );

    const compliance = generateComplianceReport('Beam Design', 'Reinforced Concrete Beam', complianceChecks);

    setState((prev) => ({ ...prev, results, compliance }));
    setActiveTab('results');
  };

  const exportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export feature coming soon');
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
                <p className="font-semibold">Stage 1: Input Parameters</p>
                <p className="text-blue-800 mt-1">Enter beam geometry, loads, and material properties</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Geometry Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Beam Geometry</CardTitle>
                <CardDescription>Dimensions in millimeters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Length (mm)</label>
                    <input
                      type="number"
                      value={state.length}
                      onChange={(e) => handleInputChange('length', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Width (mm)</label>
                    <input
                      type="number"
                      value={state.width}
                      onChange={(e) => handleInputChange('width', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={state.depth}
                      onChange={(e) => handleInputChange('depth', parseFloat(e.target.value))}
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
                <CardDescription>Loads in kN/m (per AS 1170)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Dead Load (kN/m)</label>
                    <input
                      type="number"
                      value={state.deadLoad}
                      onChange={(e) => handleInputChange('deadLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Live Load (kN/m)</label>
                    <input
                      type="number"
                      value={state.liveLoad}
                      onChange={(e) => handleInputChange('liveLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Wind Load (kN/m)</label>
                    <input
                      type="number"
                      value={state.windLoad}
                      onChange={(e) => handleInputChange('windLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Earthquake Load (kN/m)</label>
                    <input
                      type="number"
                      value={state.earthquakeLoad}
                      onChange={(e) => handleInputChange('earthquakeLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materials</CardTitle>
                <CardDescription>Concrete and steel properties</CardDescription>
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
                      <option value={50}>50 MPa</option>
                      <option value={60}>60 MPa</option>
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

            <div className="flex gap-3">
              <Button onClick={performCalculation} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Calculate Design
              </Button>
              <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, results: null, compliance: null }))}>
                Reset
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calc" className="space-y-4 mt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">Stage 2: Calculation Steps</p>
                <p className="text-amber-800 mt-1">Review detailed calculation process</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Load Combinations (AS 1170)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>ULS 1.35G: {state.results.loads.uls1.toFixed(2)} kN/m</div>
                    <div>ULS 1.2G+1.5Q: {state.results.loads.uls2.toFixed(2)} kN/m</div>
                    <div>ULS 1.2G+Wu+0.4Q: {state.results.loads.uls3.toFixed(2)} kN/m</div>
                    <div>ULS 0.9G+Wu: {state.results.loads.uls4.toFixed(2)} kN/m</div>
                    <div>ULS G+Eu+0.4Q: {state.results.loads.uls5.toFixed(2)} kN/m</div>
                    <div>ULS 0.9G+Eu: {state.results.loads.uls6.toFixed(2)} kN/m</div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <strong>Design Load (Maximum): {state.results.loads.maximum.toFixed(2)} kN/m</strong>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Design Moment</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>Applied Moment (Mu): {state.results.Mu.toFixed(2)} kN.m</p>
                  <p>Effective Depth (d): {state.results.effectiveDepth.toFixed(0)} mm</p>
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
                <p className="font-semibold">Stage 3: Design Results</p>
                <p className="text-green-800 mt-1">Reinforcement requirements and capacity checks</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reinforcement Design</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Required Steel Area</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.reinforcement.Ast.toFixed(0)} mm²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Steel Area</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.reinforcement.AstMin.toFixed(0)} mm²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Steel Ratio</p>
                      <p className="text-lg font-semibold text-foreground">{(state.results.reinforcement.ratio * 100).toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Development Length</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.devLength.toFixed(0)} mm</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Serviceability Checks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deflection Check (L/d)</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{state.results.deflectionCheck.actualSpanDepth.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">/ {state.results.deflectionCheck.limitSpanDepth.toFixed(1)}</span>
                        {state.results.deflectionCheck.compliant ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Crack Width Check</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{state.results.crackCheck.crackWidth.toFixed(3)} mm</span>
                        <span className="text-xs text-muted-foreground">/ {state.results.crackCheck.limit} mm</span>
                        {state.results.crackCheck.compliant ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                    </div>
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
                <p className="font-semibold">Stage 4: NCC & AS 3600 Compliance</p>
                <p className="text-blue-800 mt-1">Verification against standards</p>
              </div>
            </div>
          </div>

          {state.compliance ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                {state.compliance.overallCompliant ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700">Design is Compliant</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700">Design has Issues</span>
                  </>
                )}
              </div>

              {state.compliance.checks.map((check: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      {check.status === 'pass' ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{check.standard} - {check.clause}</span>
                          <Badge
                            variant="outline"
                            className={
                              check.status === 'pass'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : check.status === 'warning'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                            }
                          >
                            {check.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{check.requirement}</p>
                        <p className="text-sm">{check.message}</p>
                        {check.reference && (
                          <p className="text-xs text-muted-foreground mt-2">Reference: {check.reference}</p>
                        )}
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
              <Download className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <p className="font-semibold">Stage 5: Export & Documentation</p>
                <p className="text-purple-800 mt-1">Generate reports and design documentation</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={exportPDF} variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Export PDF Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Bar Bending Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Compliance Certificate
            </Button>
            <Button variant="outline" className="justify-start">
              <Download className="w-4 h-4 mr-2" />
              Design Assumptions
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
