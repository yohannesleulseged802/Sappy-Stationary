import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function brandedPdf(title: string): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const w = doc.internal.pageSize.getWidth();

  // Masthead band
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 0, w, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Sappy Stationary", 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 30, 50);

  // Footer line
  const h = doc.internal.pageSize.getHeight();
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text(`© ${new Date().getFullYear()} Sappy Stationary • sappyshop.site`, 30, h - 20);
  doc.text(`Page ${doc.getNumberOfPages()}`, w - 60, h - 20);

  return doc;
}

export function addTable(doc: jsPDF, head: string[][], body: any[][], startY = 90) {
  autoTable(doc, {
    head,
    body,
    startY,
    theme: "striped",
    headStyles: { fillColor: [4, 120, 87], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [246, 253, 247] },
    margin: { left: 30, right: 30 },
  });
  return (doc as any).lastAutoTable.finalY;
}