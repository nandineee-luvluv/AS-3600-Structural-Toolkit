import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface DesignResult {
  label: string;
  value: string | number;
  unit?: string;
  status?: string;
  equation?: string;
  clause?: string;
}

export interface DesignInput {
  label: string;
  value: string | number;
  unit?: string;
}

export function exportToPDF(
  title: string,
  inputs: DesignInput[],
  results: DesignResult[],
  filename: string = 'design-report.pdf'
) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.text('AS 3600 Design Report', 14, 22);
  doc.setFontSize(14);
  doc.text(title, 14, 32);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);

  // Inputs Table
  doc.setFontSize(12);
  doc.text('Input Parameters', 14, 50);
  doc.autoTable({
    startY: 55,
    head: [['Parameter', 'Value', 'Unit']],
    body: inputs.map(i => [i.label, i.value, i.unit || '-']),
    theme: 'striped',
    headStyles: { fillStyle: [20, 20, 20] }
  });

  // Results Table
  const finalY = (doc as any).lastAutoTable.finalY || 55;
  doc.text('Design Results & Compliance', 14, finalY + 15);
  doc.autoTable({
    startY: finalY + 20,
    head: [['Check', 'Value', 'Unit', 'Status', 'Clause', 'Formula']],
    body: results.map(r => [
      r.label, 
      r.value, 
      r.unit || '-', 
      r.status || '-', 
      r.clause || '-', 
      r.equation || '-'
    ]),
    theme: 'grid',
    headStyles: { fillStyle: [20, 20, 20] },
    styles: { fontSize: 8 },
    columnStyles: {
      5: { cellWidth: 50 } // Formula column width
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'pass') data.cell.styles.textColor = [0, 128, 0];
        if (data.cell.raw === 'fail') data.cell.styles.textColor = [255, 0, 0];
      }
    }
  });

  doc.save(filename);
}

export function exportToPython(
  title: string,
  inputs: DesignInput[],
  procedure: string,
  filename: string = 'design_procedure.py'
) {
  let content = `\"\"\"\nAS 3600 Design Procedure: ${title}\nGenerated on: ${new Date().toLocaleString()}\n\"\"\"\n\n`;
  
  content += "# Input Parameters\n";
  inputs.forEach(i => {
    const varName = i.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    content += `${varName} = ${typeof i.value === 'number' ? i.value : `'${i.value}'`}  # ${i.unit || ''}\n`;
  });

  content += "\n# Design Procedure\n";
  content += procedure;

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
