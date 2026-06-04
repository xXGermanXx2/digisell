/**
 * Invoice PDF Generator
 * Generates professional PDF invoices using HTML-to-PDF via a simple HTML template.
 * Falls back to a plain-text representation if PDF generation is unavailable.
 */

export interface InvoiceData {
  orderNumber: string;
  createdAt: Date | string;
  billingName?: string | null;
  billingEmail?: string | null;
  billingAddress?: string | null;
  billingCity?: string | null;
  billingZip?: string | null;
  billingCountry?: string | null;
  billingVatId?: string | null;
  customerEmail: string;
  customerName?: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    taxRate?: string | null;
    taxAmount?: string | null;
  }>;
  subtotal: string;
  discount?: string | null;
  taxAmount?: string | null;
  fee?: string | null;
  total: string;
  currency?: string;
  paymentMethod?: string | null;
  shopName?: string;
  shopEmail?: string;
}

export function generateInvoiceHtml(data: InvoiceData): string {
  const currency = data.currency ?? "EUR";
  const shopName = data.shopName ?? "DigiSell";
  const date = new Date(data.createdAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });
  const billTo = data.billingName ?? data.customerName ?? data.customerEmail;

  const itemRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;">${escHtml(item.productName)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${currency} ${parseFloat(item.unitPrice).toFixed(2)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;">${item.taxRate ? `${item.taxRate}%` : "–"}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${currency} ${parseFloat(item.totalPrice).toFixed(2)}</td>
    </tr>
  `).join("");

  const discount = parseFloat(data.discount ?? "0");
  const tax = parseFloat(data.taxAmount ?? "0");
  const fee = parseFloat(data.fee ?? "0");

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rechnung ${escHtml(data.orderNumber)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1f2937; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 48px 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .logo { font-size: 24px; font-weight: 800; color: #4f46e5; }
  .invoice-meta { text-align: right; }
  .invoice-meta h1 { font-size: 28px; font-weight: 700; color: #111827; margin-bottom: 4px; }
  .invoice-meta p { color: #6b7280; font-size: 13px; }
  .divider { height: 2px; background: linear-gradient(90deg, #4f46e5, #818cf8); margin: 24px 0; border-radius: 2px; }
  .addresses { display: flex; gap: 40px; margin-bottom: 32px; }
  .address-block { flex: 1; }
  .address-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 8px; }
  .address-block p { line-height: 1.6; color: #374151; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead tr { background: #f9fafb; }
  thead th { padding: 12px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  thead th:not(:first-child) { text-align: right; }
  thead th:nth-child(2) { text-align: center; }
  .totals { margin-left: auto; width: 280px; }
  .totals-row { display: flex; justify-content: space-between; padding: 6px 0; color: #374151; }
  .totals-row.total { border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 12px; font-size: 16px; font-weight: 700; color: #111827; }
  .totals-row.discount { color: #10b981; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #d1fae5; color: #065f46; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo">${escHtml(shopName)}</div>
    <div class="invoice-meta">
      <h1>RECHNUNG</h1>
      <p><strong>${escHtml(data.orderNumber)}</strong></p>
      <p>${date}</p>
      ${data.paymentMethod ? `<p style="margin-top:6px"><span class="badge">Bezahlt via ${escHtml(data.paymentMethod)}</span></p>` : ""}
    </div>
  </div>
  <div class="divider"></div>
  <div class="addresses">
    <div class="address-block">
      <h3>Von</h3>
      <p><strong>${escHtml(shopName)}</strong></p>
      ${data.shopEmail ? `<p>${escHtml(data.shopEmail)}</p>` : ""}
    </div>
    <div class="address-block">
      <h3>An</h3>
      <p><strong>${escHtml(billTo)}</strong></p>
      ${data.billingEmail ? `<p>${escHtml(data.billingEmail)}</p>` : `<p>${escHtml(data.customerEmail)}</p>`}
      ${data.billingAddress ? `<p>${escHtml(data.billingAddress)}</p>` : ""}
      ${data.billingZip || data.billingCity ? `<p>${[data.billingZip, data.billingCity].filter(Boolean).join(" ")}</p>` : ""}
      ${data.billingCountry ? `<p>${escHtml(data.billingCountry)}</p>` : ""}
      ${data.billingVatId ? `<p>USt-IdNr.: ${escHtml(data.billingVatId)}</p>` : ""}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Produkt</th>
        <th style="text-align:center;">Menge</th>
        <th style="text-align:right;">Einzelpreis</th>
        <th style="text-align:right;">MwSt.</th>
        <th style="text-align:right;">Gesamt</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="totals">
    <div class="totals-row"><span>Zwischensumme</span><span>${currency} ${parseFloat(data.subtotal).toFixed(2)}</span></div>
    ${discount > 0 ? `<div class="totals-row discount"><span>Rabatt</span><span>– ${currency} ${discount.toFixed(2)}</span></div>` : ""}
    ${tax > 0 ? `<div class="totals-row"><span>MwSt.</span><span>${currency} ${tax.toFixed(2)}</span></div>` : ""}
    ${fee > 0 ? `<div class="totals-row"><span>Plattformgebühr</span><span>${currency} ${fee.toFixed(2)}</span></div>` : ""}
    <div class="totals-row total"><span>Gesamtbetrag</span><span>${currency} ${parseFloat(data.total).toFixed(2)}</span></div>
  </div>
  <div class="footer">
    <p>Vielen Dank für Ihren Einkauf bei ${escHtml(shopName)}!</p>
    <p style="margin-top:4px;">Diese Rechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.</p>
  </div>
</div>
</body>
</html>`;
}

function escHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
