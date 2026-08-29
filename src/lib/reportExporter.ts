import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Payment, RevenueRiskCase, DashboardSummary } from '../types';
import { formatINR } from './utils';

export interface ReportExportOptions {
  payments: Payment[];
  cases: RevenueRiskCase[];
  summary: DashboardSummary | null;
  period: '7d' | '30d' | '90d' | 'ytd' | 'all';
  scope: 'all' | 'recovered' | 'unrecovered' | 'high_value';
  maskPII?: boolean;
  companyName?: string;
  reportTitle?: string;
}

export function filterReportData(options: ReportExportOptions) {
  const { payments, cases, scope } = options;

  return payments.filter((p) => {
    const riskCase = cases.find((c) => c.payment_id === p.id);
    const isRecovered = p.status === 'captured' || riskCase?.status === 'SUCCEEDED';

    if (scope === 'recovered') return isRecovered;
    if (scope === 'unrecovered') return !isRecovered;
    if (scope === 'high_value') return p.amount >= 10000;
    return true;
  });
}

/**
 * Export structured financial reconciliation and recovery ledger to CSV
 */
export function exportToCSV(options: ReportExportOptions) {
  const filteredPayments = filterReportData(options);
  const periodLabel = options.period.toUpperCase();
  const timestamp = new Date().toISOString();

  const headers = [
    'Report Date',
    'Payment ID',
    'Customer Name',
    'Customer Email',
    'Payment Method Rail',
    'Original Amount (INR)',
    'Gateway Status',
    'Failure Reason Code',
    'Failure Description',
    'Recovery Status',
    'Recovered Amount (INR)',
    'Recovery Rate Contribution',
    'AI Strategy Applied',
    'Created At',
  ];

  const rows = filteredPayments.map((p) => {
    const riskCase = options.cases.find((c) => c.payment_id === p.id);
    const isRecovered = p.status === 'captured' || riskCase?.status === 'SUCCEEDED';
    const customerName = options.maskPII
      ? `${(p.customer?.name || 'Customer').charAt(0)}***`
      : p.customer?.name || 'Customer';
    const customerEmail = options.maskPII
      ? p.customer?.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || ''
      : p.customer?.email || '';

    return [
      `"${timestamp.split('T')[0]}"`,
      `"${p.id}"`,
      `"${customerName.replace(/"/g, '""')}"`,
      `"${customerEmail.replace(/"/g, '""')}"`,
      `"${p.payment_method.toUpperCase()}"`,
      p.amount,
      `"${p.status.toUpperCase()}"`,
      `"${p.failure_code || p.failure_reason || 'GATEWAY_ERROR'}"`,
      `"${(p.failure_description || p.failure_reason || '').replace(/"/g, '""')}"`,
      `"${isRecovered ? 'RECOVERED' : 'UNRECOVERED'}"`,
      isRecovered ? p.amount : 0,
      isRecovered ? '100%' : '0%',
      `"${riskCase?.ai_decision?.action || 'STANDARD_RETRY'}"`,
      `"${p.created_at}"`,
    ];
  });

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `RecoverIQ_Financial_Report_${options.scope}_${options.period}_${Date.now()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export professional executive financial recovery report to PDF
 */
export function exportToPDF(options: ReportExportOptions) {
  const { summary, cases, period, scope, maskPII = false, companyName = 'Apex Technologies Pvt Ltd' } = options;
  const filteredPayments = filterReportData(options);

  // Compute calculated metrics
  const totalVolume = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const recoveredPayments = filteredPayments.filter((p) => {
    const c = cases.find((item) => item.payment_id === p.id);
    return p.status === 'captured' || c?.status === 'SUCCEEDED';
  });
  const recoveredVolume = recoveredPayments.reduce((sum, p) => sum + p.amount, 0);
  const recoveryRate = totalVolume > 0 ? ((recoveredVolume / totalVolume) * 100).toFixed(1) : '0.0';
  const unrecoveredVolume = Math.max(0, totalVolume - recoveredVolume);

  // Create jsPDF Document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins

  // Header Banner Background (Dark Fintech Slate)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Brand Name & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('RecoverIQ', margin, 34);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text('FINANCIAL REVENUE RECOVERY & RECONCILIATION STATEMENT', margin, 48);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Entity: ${companyName}  |  Period: ${period.toUpperCase()}  |  Scope: ${scope.toUpperCase()}`, margin, 62);

  // Generation timestamp on right
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - margin, 62, { align: 'right' });

  let currentY = 100;

  // Executive Summary Section Heading
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Recovery & Financial Performance', margin, currentY);

  currentY += 12;

  // Summary Metrics Grid Cards
  const cardWidth = (pageWidth - margin * 2 - 24) / 4;
  const cardHeight = 52;

  const cards = [
    {
      title: 'FAILED VOLUME AT RISK',
      val: formatINR(totalVolume),
      sub: `${filteredPayments.length} Total Txns`,
      color: [248, 250, 252],
      border: [226, 232, 240],
      textCol: [15, 23, 42],
    },
    {
      title: 'GROSS RECOVERED',
      val: formatINR(recoveredVolume),
      sub: `${recoveredPayments.length} Recovered`,
      color: [236, 253, 245],
      border: [167, 243, 208],
      textCol: [4, 120, 87],
    },
    {
      title: 'RECOVERY EFFECTIVENESS',
      val: `${recoveryRate}%`,
      sub: 'Yield Realized',
      color: [238, 242, 255],
      border: [199, 210, 254],
      textCol: [67, 56, 202],
    },
    {
      title: 'UNRECOVERED LOSS',
      val: formatINR(unrecoveredVolume),
      sub: 'Hard Declines',
      color: [255, 241, 242],
      border: [254, 205, 211],
      textCol: [225, 29, 72],
    },
  ];

  cards.forEach((c, idx) => {
    const x = margin + idx * (cardWidth + 8);
    doc.setFillColor(c.color[0], c.color[1], c.color[2]);
    doc.setDrawColor(c.border[0], c.border[1], c.border[2]);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 4, 4, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, x + 8, currentY + 14);

    doc.setFontSize(11);
    doc.setTextColor(c.textCol[0], c.textCol[1], c.textCol[2]);
    doc.text(c.val, x + 8, currentY + 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, x + 8, currentY + 42);
  });

  currentY += cardHeight + 20;

  // Section 2: Payment Rails Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Payment Rail Reconciliation Summary', margin, currentY);
  currentY += 8;

  // Group by Payment Rail
  const rails = ['upi', 'card', 'netbanking', 'wallet', 'emi'] as const;
  const railSummaryData = rails.map((r) => {
    const rPayments = filteredPayments.filter((p) => p.payment_method === r);
    const rTotal = rPayments.reduce((s, p) => s + p.amount, 0);
    const rRec = rPayments.filter((p) => {
      const c = cases.find((item) => item.payment_id === p.id);
      return p.status === 'captured' || c?.status === 'SUCCEEDED';
    });
    const rRecVol = rRec.reduce((s, p) => s + p.amount, 0);
    const rate = rTotal > 0 ? ((rRecVol / rTotal) * 100).toFixed(1) + '%' : '0.0%';

    const railNameMap: Record<string, string> = {
      upi: 'UPI AutoPay & Direct Collect',
      card: 'Credit & Debit Cards (3DS 2.0)',
      netbanking: 'Netbanking Direct Debit',
      wallet: 'Digital Wallets & Stored Balance',
      emi: 'Cardless & Co-branded EMI',
    };

    return [
      railNameMap[r] || r.toUpperCase(),
      rPayments.length.toString(),
      formatINR(rTotal),
      formatINR(rRecVol),
      rate,
      rRec.length === rPayments.length && rPayments.length > 0 ? 'Full Yield' : 'Reconciled',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Payment Rail Protocol', 'Txns', 'Processed Volume', 'Recovered Volume', 'Yield Rate', 'Settlement Status']],
    body: railSummaryData,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const railTableFinalY = (doc as any).lastAutoTable?.finalY || currentY + 90;
  currentY = railTableFinalY + 16;

  // Section 3: Itemized Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Detailed Transaction Recovery Audit Ledger', margin, currentY);
  currentY += 8;

  const itemizedRows = filteredPayments.slice(0, 40).map((p) => {
    const riskCase = cases.find((c) => c.payment_id === p.id);
    const isRec = p.status === 'captured' || riskCase?.status === 'SUCCEEDED';
    const custName = maskPII
      ? `${(p.customer?.name || 'Customer').charAt(0)}***`
      : p.customer?.name || 'Customer';

    return [
      p.id,
      custName,
      p.payment_method.toUpperCase(),
      p.failure_reason.replace(/_/g, ' '),
      formatINR(p.amount),
      isRec ? 'RECOVERED' : 'UNRECOVERED',
      isRec ? formatINR(p.amount) : '₹0',
      p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '-',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Payment ID', 'Customer', 'Method', 'Failure Reason', 'Original Amount', 'Recovery Status', 'Settled Amount', 'Date']],
    body: itemizedRows,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [51, 65, 85],
      cellPadding: 3.5,
    },
    didDrawCell: (data) => {
      // Highlight recovered status cell in emerald green
      if (data.column.index === 5 && data.cell.text[0] === 'RECOVERED') {
        doc.setTextColor(4, 120, 87);
        doc.setFont('helvetica', 'bold');
      }
    },
  });

  // Footer / Compliance Note
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `RecoverIQ Autonomous Financial Governance Engine  |  Page ${i} of ${pageCount}  |  Strictly Confidential`,
      margin,
      pageHeight - 16
    );
    doc.text('Certified Audit Trail', pageWidth - margin, pageHeight - 16, { align: 'right' });
  }

  // Save the PDF
  doc.save(`RecoverIQ_Financial_Statement_${scope}_${period}_${Date.now()}.pdf`);
}
