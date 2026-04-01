import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any, filename: string) {
  if (!data) return;
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().getTime()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: any[], filename: string, title?: string) {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('landscape');
  
  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
  }

  const headers = Object.keys(data[0]);
  
  // Clean up data for PDF (remove objects, ensure string format)
  const body = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (typeof val === 'object' && val !== null) return JSON.stringify(val);
      if (val === null || val === undefined) return '';
      return String(val);
    })
  );

  autoTable(doc, {
    head: [headers.map(h => h.charAt(0).toUpperCase() + h.slice(1).replace(/_/g, ' '))],
    body: body,
    startY: title ? 30 : 20,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [0, 217, 192],
      textColor: [8, 11, 15],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  doc.save(`${filename}-${new Date().getTime()}.pdf`);
}
