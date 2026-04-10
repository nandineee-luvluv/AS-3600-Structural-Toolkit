import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { calculateColumnInteractionDiagram, DesignParameters } from '@/lib/as3600-enhanced';
import { checkStructuralCompliance, generateComplianceReport } from '@/lib/ncc-compliance';

interface ColumnDesignState {
  // Geometry
  length: number; // height
  width: number;
  depth: number;
  cover: number;
  columnType: 'rectangular' | 'circular';
  diameter?: number;

  // Loads
  axialLoad: number;
  momentX: number;
  momentY: number;
  eccentricityX: number;
  eccentricityY: number;

  // Materials
  concreteGrade: number;
  steelGrade: number;
  steelPercentage: number;

  // Results
  results: any;
  compliance: any;
  slendernessRatio?: number;
}

export default function ColumnCalculator() {
  const [state, setState] = useState<ColumnDesignState>({
    length: 3000,
    width: 400,
    depth: 400,
    cover: 40,
    columnType: 'rectangular',
    axialLoad: 500,
    momentX: 50,
    momentY: 30,
    eccentricityX: 0,
    eccentricityY: 0,
    concreteGrade: 30,
    steelGrade: 500,
    steelPercentage: 2,
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
      phiFactor: 0.6,
      cover: state.cover,
    };

    // Calculate gross area
    const Ag = state.width * state.depth;

    // Calculate steel area
    const Ast = (state.steelPercentage / 100) * Ag;

    // Generate interaction diagram
    const interactionDiagram = calculateColumnInteractionDiagram(
      state.width,
      state.depth,
      Ast,
      parameters,
      50
    );

    // Find maximum axial load capacity
    const maxAxialLoad = Math.max(...interactionDiagram.map((p) => p.N));

    // Calculate slenderness ratio
    const slendernessRatio = state.length / Math.min(state.width, state.depth);

    // Calculate minimum eccentricity
    const minEccentricity = Math.max(20, state.length / 400);

    // Design eccentricity
    const designEccentricity = Math.max(
      minEccentricity,
      Math.sqrt(state.eccentricityX ** 2 + state.eccentricityY ** 2)
    );

    // Check if design is within interaction diagram
    const designPoint = {
      N: state.axialLoad,
      M: state.axialLoad * (designEccentricity / 1000),
    };

    // Find if design point is within diagram
    let isWithinDiagram = false;
    for (let i = 0; i < interactionDiagram.length - 1; i++) {
      const p1 = interactionDiagram[i];
      const p2 = interactionDiagram[i + 1];

      if (
        designPoint.N >= p1.N &&
        designPoint.N <= p2.N &&
        designPoint.M <= Math.max(p1.M, p2.M)
      ) {
        isWithinDiagram = true;
        break;
      }
    }

    const results = {
      Ag,
      Ast,
      interactionDiagram,
      maxAxialLoad,
      slendernessRatio,
      minEccentricity,
      designEccentricity,
      designPoint,
      isWithinDiagram,
      utilization: (state.axialLoad / maxAxialLoad) * 100,
    };

    // Check compliance
    const complianceChecks = checkStructuralCompliance(
      state.concreteGrade,
      state.steelGrade,
      'ULS',
      'Combined axial and bending',
      state.steelPercentage / 100,
      'column'
    );

    // Add column-specific checks
    if (state.steelPercentage < 0.8) {
      complianceChecks.push({
        standard: 'AS 3600',
        clause: '10.3.2',
        requirement: 'Minimum reinforcement',
        status: 'fail',
        message: `Steel percentage ${state.steelPercentage}% is below minimum 0.8%`,
        reference: 'AS 3600:2018 Clause 10.3.2',
      });
    }

    if (results.slendernessRatio > 50) {
      complianceChecks.push({
        standard: 'AS 3600',
        clause: '10.2',
        requirement: 'Slenderness limits',
        status: 'warning',
        message: `Slenderness ratio ${results.slendernessRatio.toFixed(1)} exceeds 50. P-Delta effects should be considered.`,
        reference: 'AS 3600:2018 Clause 10.2',
      });
    }

    const compliance = generateComplianceReport('Column Design', 'Reinforced Concrete Column', complianceChecks);

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
                <p className="font-semibold">Stage 1: Column Design Parameters</p>
                <p className="text-blue-800 mt-1">Enter column geometry, loads, and material properties</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Column Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Column Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="rectangular"
                      checked={state.columnType === 'rectangular'}
                      onChange={(e) => handleInputChange('columnType', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Rectangular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="circular"
                      checked={state.columnType === 'circular'}
                      onChange={(e) => handleInputChange('columnType', e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Circular</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Geometry Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Column Geometry</CardTitle>
                <CardDescription>Dimensions in millimeters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Height (mm)</label>
                    <input
                      type="number"
                      value={state.length}
                      onChange={(e) => handleInputChange('length', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {state.columnType === 'rectangular' ? (
                    <>
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
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Diameter (mm)</label>
                      <input
                        type="number"
                        value={state.diameter || 400}
                        onChange={(e) => handleInputChange('diameter', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
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
                <CardDescription>Axial load in kN, moments in kN.m</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Axial Load (kN)</label>
                    <input
                      type="number"
                      value={state.axialLoad}
                      onChange={(e) => handleInputChange('axialLoad', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Moment X (kN.m)</label>
                    <input
                      type="number"
                      value={state.momentX}
                      onChange={(e) => handleInputChange('momentX', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Moment Y (kN.m)</label>
                    <input
                      type="number"
                      value={state.momentY}
                      onChange={(e) => handleInputChange('momentY', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Materials Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materials & Reinforcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Steel % (of Ag)</label>
                    <input
                      type="number"
                      value={state.steelPercentage}
                      onChange={(e) => handleInputChange('steelPercentage', parseFloat(e.target.value))}
                      step="0.1"
                      min="0.8"
                      max="6"
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button onClick={performCalculation} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Calculate Column Design
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
                <p className="text-amber-800 mt-1">Column design calculations and interaction diagram</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Column Properties</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                  <div>Gross Area (Ag): {state.results?.Ag?.toFixed(0) || 'N/A'} mm²</div>
                  <div>Steel Area (Ast): {state.results?.Ast?.toFixed(0) || 'N/A'} mm²</div>
                    <div>Slenderness Ratio: {state.results?.slendernessRatio?.toFixed(1) || 'N/A'}</div>
                    <div>Min Eccentricity: {state.results?.minEccentricity?.toFixed(0) || 'N/A'} mm</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Design Check</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Axial Load Capacity:</span>
                      <span className="font-semibold">{state.results.maxAxialLoad.toFixed(0)} kN</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Design Utilization:</span>
                      <span className="font-semibold">{state.results.utilization.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Within Interaction Diagram:</span>
                      {state.results.isWithinDiagram ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
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
                <p className="font-semibold">Stage 3: Design Results</p>
                <p className="text-green-800 mt-1">Column capacity and reinforcement summary</p>
              </div>
            </div>
          </div>

          {state.results ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Reinforcement Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Steel Area</p>
                      <p className="text-lg font-semibold text-foreground">{state.results.Ast.toFixed(0)} mm²</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Steel Percentage</p>
                      <p className="text-lg font-semibold text-foreground">{state.steelPercentage.toFixed(2)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Capacity Check</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="text-sm font-medium">Design Status</span>
                      {state.results.isWithinDiagram ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          ACCEPTABLE
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          INCREASE STEEL
                        </Badge>
                      )}
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
              Interaction Diagram
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
