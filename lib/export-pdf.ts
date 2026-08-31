import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { SalesRecord } from "@/lib/api";
import { sarabunRegularBase64 } from "@/lib/fonts/sarabun-regular";

export function exportSalesReportPdf(records: SalesRecord[], insight: string | null) {
  const doc = new jsPDF();

  doc.addFileToVFS("Sarabun-Regular.ttf", sarabunRegularBase64);
  doc.addFont("Sarabun-Regular.ttf", "Sarabun", "normal");
  doc.setFont("Sarabun");

  doc.setFontSize(18);
  doc.text("Sales Report", 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 25);

  let nextY = 32;

  if (insight) {
    doc.setFontSize(11);
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(insight, 180);
    doc.text(lines, 14, nextY);
    nextY += lines.length * 5 + 8;
  }

  autoTable(doc, {
    startY: nextY,
    styles: { font: "Sarabun" },
    head: [["Product", "Amount", "Team", "Sold At", "Recorded By"]],
    body: records.map((r) => [
      r.product,
      Number(r.amount).toFixed(2),
      r.team.name,
      new Date(r.soldAt).toLocaleDateString(),
      r.recordedBy.name,
    ]),
  });

  doc.save(`teamsight-sales-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
