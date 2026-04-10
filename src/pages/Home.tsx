import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calculator } from 'lucide-react';
import BeamCalculatorEnhanced from '@/components/calculators/BeamCalculatorEnhanced';
import ColumnCalculator from '@/components/calculators/ColumnCalculator';
import SlabCalculator from '@/components/calculators/SlabCalculator';

export default function Home() {
  const [activeCalculator, setActiveCalculator] = useState('beam');

  const calculators = [
    { id: 'beam', label: 'Beam Design', icon: '📐', description: 'Flexural and shear design' },
    { id: 'column', label: 'Column Design', icon: '📏', description: 'Axial and biaxial bending' },
    { id: 'slab', label: 'Slab Design', icon: '⬜', description: 'Two-way slab analysis' },
    { id: 'wall', label: 'Wall Design', icon: '🧱', description: 'Shear wall design' },
    { id: 'footing', label: 'Footing Design', icon: '⬇️', description: 'Foundation design' },
    { id: 'retaining', label: 'Retaining Wall', icon: '🛡️', description: 'Retaining structure' },
  ];

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'beam':
        return <BeamCalculatorEnhanced />;
      case 'column':
        return <ColumnCalculator />;
      case 'slab':
        return <SlabCalculator />;
      default:
        return (
          <div className="text-center py-12">
            <Calculator className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Calculator coming soon</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">AS-3600 Structural Toolkit</h1>
              <p className="text-sm text-muted-foreground mt-1">NCC Compliant RCC Design Calculator v2.0</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                AS 3600 Compliant
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                NCC 2022+
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Design Tools</CardTitle>
                <CardDescription>Select a calculator</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {calculators.map((calc) => (
                  <button
                    key={calc.id}
                    onClick={() => setActiveCalculator(calc.id)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                      activeCalculator === calc.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{calc.icon}</span>
                      <div>
                        <div className="font-medium">{calc.label}</div>
                        <div className="text-xs opacity-75">{calc.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Quick Reference */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Code References</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3 text-muted-foreground">
                <div>
                  <strong className="text-foreground">AS 3600:2018</strong>
                  <p>Concrete Structures</p>
                </div>
                <div>
                  <strong className="text-foreground">AS 1170 Series</strong>
                  <p>Structural Design Actions</p>
                </div>
                <div>
                  <strong className="text-foreground">NCC 2022</strong>
                  <p>National Construction Code</p>
                </div>
                <div>
                  <strong className="text-foreground">AS 2870</strong>
                  <p>Residential Slabs</p>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Features</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>ULS Design Method</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Serviceability Checks</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>NCC Compliance</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Detailed Reports</span>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {calculators.find((c) => c.id === activeCalculator)?.label} Calculator
                </CardTitle>
                <CardDescription>
                  {calculators.find((c) => c.id === activeCalculator)?.description} - AS 3600 compliant design
                </CardDescription>
              </CardHeader>
              <CardContent>{renderCalculator()}</CardContent>
            </Card>

            {/* Design Information Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Design Methodology</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-3">
                <p>
                  This toolkit implements the <strong className="text-foreground">Ultimate Limit State (ULS)</strong> design approach as per AS 3600:2018. 
                  All calculations follow the strength design method with appropriate safety factors (phi factors).
                </p>
                <p>
                  <strong className="text-foreground">Load Combinations:</strong> AS 1170 standard load combinations are applied automatically based on the design scenario selected.
                </p>
                <p>
                  <strong className="text-foreground">Serviceability:</strong> Deflection and cracking checks are performed to ensure structures meet serviceability requirements.
                </p>
                <p>
                  <strong className="text-foreground">Compliance:</strong> All designs are verified against NCC 2022+ requirements and relevant Australian Standards.
                </p>
              </CardContent>
            </Card>

            {/* Standards Information */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-base">Supported Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-secondary rounded-lg">
                    <strong className="text-foreground">AS 3600:2018</strong>
                    <p className="text-muted-foreground mt-1">Concrete Structures - Ultimate and serviceability limit state design</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <strong className="text-foreground">AS 1170 Series</strong>
                    <p className="text-muted-foreground mt-1">Structural Design Actions - Load combinations and factors</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <strong className="text-foreground">NCC 2022</strong>
                    <p className="text-muted-foreground mt-1">National Construction Code - Building compliance requirements</p>
                  </div>
                  <div className="p-3 bg-secondary rounded-lg">
                    <strong className="text-foreground">AS 2870:2011</strong>
                    <p className="text-muted-foreground mt-1">Residential Slabs - Domestic slab design</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>AS-3600 Structural Toolkit v2.0 | NCC Compliant | Built for Professional Structural Design</p>
          <p className="mt-2">© 2026 Enhanced Structural Design Tools | All calculations follow AS 3600:2018</p>
        </div>
      </footer>
    </div>
  );
}
