import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BUSINESS, PARTNER_1, PARTNER_2, SUBSCRIPTION_FEE, REPEAT_CLIENT_RATE, pct } from "./calc";

const money = (n) =>
  "£" + (n || 0).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const GREEN = [34, 84, 61];

export function downloadReceipt(result, { period } = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const now = new Date();
  const receiptNo = "HOH-" + now.toISOString().slice(0, 10).replace(/-/g, "") + "-" +
    String(now.getHours()).padStart(2, "0") + String(now.getMinutes()).padStart(2, "0");

  // Header band
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(BUSINESS, 40, 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Landscaping & Gardening · London", 40, 60);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("PROFIT SHARING RECEIPT", W - 40, 42, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Receipt no. ${receiptNo}`, W - 40, 58, { align: "right" });
  doc.text(`Issued ${now.toLocaleString("en-GB")}`, W - 40, 72, { align: "right" });

  doc.setTextColor(30, 30, 30);
  let y = 120;
  doc.setFontSize(10);
  doc.text(`Partner 1: ${PARTNER_1}`, 40, y);
  doc.text(`Partner 2: ${PARTNER_2}`, 40, y + 15);
  if (period) doc.text(`Period: ${period}`, W - 40, y, { align: "right" });
  y += 35;

  const section = (title, rows, total, haiderLabel, haiderAmt, hamidLabel, hamidAmt) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(title, 40, y);
    const wide = result.usesCost; // add Price / Cost columns
    const last = wide ? 4 : 2;
    const span = (label) => (wide ? { content: label, colSpan: 3 } : label);
    const footRow = (label, amt) => ["", span(label), money(amt)];
    autoTable(doc, {
      startY: y + 8,
      head: [["#", "Project / client", ...(wide ? ["Price", "Cost"] : []), "Gross profit"]],
      body: rows.length
        ? rows.map((p, i) => [
            i + 1, p.name || "Untitled project",
            ...(wide ? (p.useCost ? [money(p.price), money(p.cost)] : ["–", "–"]) : []),
            money(p.profit),
          ])
        : [["", span("No projects"), money(0)]],
      foot: [
        footRow("Total gross profit", total),
        footRow(`${PARTNER_2} share ${haiderLabel}`, haiderAmt),
        footRow(`${PARTNER_1} share ${hamidLabel}`, hamidAmt),
      ],
      theme: "grid",
      headStyles: { fillColor: GREEN },
      footStyles: { fillColor: [236, 243, 238], textColor: 30 },
      columnStyles: wide
        ? { 0: { cellWidth: 30 }, 2: { halign: "right", cellWidth: 85 }, 3: { halign: "right", cellWidth: 85 }, 4: { halign: "right", cellWidth: 100 } }
        : { 0: { cellWidth: 30 }, 2: { halign: "right", cellWidth: 120 } },
      margin: { left: 40, right: 40 },
      didParseCell: (d) => {
        if (d.section === "foot" && d.column.index === last) d.cell.styles.halign = "right";
        if (d.section === "head" && d.column.index >= 2) d.cell.styles.halign = "right";
      },
    });
    y = doc.lastAutoTable.finalY + 25;
  };

  section(
    "Scenario 1 – New (first-time) clients",
    result.newProjects, result.newTotal,
    `(${pct(result.newRate)})${result.newTier ? " – tier: " + result.newTier.label : ""}`, result.haider.new,
    `(${pct(1 - result.newRate)})`, result.hamid.new
  );
  section(
    "Scenario 2 – Repeat clients",
    result.repeatProjects, result.repeatTotal,
    `(${pct(result.repeatRate)})`, result.haider.repeat,
    `(${pct(1 - result.repeatRate)})`, result.hamid.repeat
  );
  section(
    "Scenario 3 – Monthly maintenance subscribers",
    result.subProjects, result.subTotal,
    `(£${SUBSCRIPTION_FEE} x ${result.subProjects.length})`, result.haider.subscription,
    "(remainder)", result.hamid.subscription
  );

  // Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Overall summary", 40, y);
  autoTable(doc, {
    startY: y + 8,
    head: [["Partner", "New clients", "Repeat clients", "Subscriptions", "Total payout"]],
    body: [
      [PARTNER_1, money(result.hamid.new), money(result.hamid.repeat), money(result.hamid.subscription), money(result.hamid.total)],
      [PARTNER_2, money(result.haider.new), money(result.haider.repeat), money(result.haider.subscription), money(result.haider.total)],
    ],
    foot: [["Combined", money(result.newTotal), money(result.repeatTotal), money(result.subTotal), money(result.grandTotal)]],
    theme: "grid",
    headStyles: { fillColor: GREEN },
    footStyles: { fillColor: GREEN, textColor: 255 },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", fontStyle: "bold" } },
    margin: { left: 40, right: 40 },
    didParseCell: (d) => { if (d.section === "foot" && d.column.index > 0) d.cell.styles.halign = "right"; },
  });
  y = doc.lastAutoTable.finalY + 38;
  if (y > doc.internal.pageSize.getHeight() - 55) { doc.addPage(); y = 80; }

  // Signatures
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.line(40, y, 230, y);
  doc.line(W - 230, y, W - 40, y);
  doc.text(PARTNER_1, 40, y + 14);
  doc.text(PARTNER_2, W - 230, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `New-client rate is set by the total new-client gross profit and applied to that whole total. Repeat-client rate is a flat ${pct(REPEAT_CLIENT_RATE)}. Subscribers: £${SUBSCRIPTION_FEE} per project.`,
    40, doc.internal.pageSize.getHeight() - 30
  );

  doc.save(`${receiptNo}.pdf`);
}
