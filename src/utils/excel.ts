import { DailyLog } from '../types';

/**
 * Generates an Excel-compatible HTML Spreadsheet from a DailyLog.
 * All cells, data, and digits are centrally aligned (`text-align: center`)
 * and represent figures in Rupees (₹).
 * 
 * Sizing:
 * Row heights are set to exactly 20pt (`tr { height: 20pt; }` and `td, th { height: 20pt; }`) 
 * to align with the user's request for cell size 20 in the Excel sheet.
 */
export function generateExcelHTML(log: DailyLog): string {
  const stockItems = log.stockItems || [];
  const cashDetails = log.cashDetails || { morningOpening: 0, nightClosing: 0, gpaySales: 0, handSales: 0 };
  const expenses = log.expenses || [];

  const totalStockSalesCount = stockItems.reduce((acc, item) => acc + item.salesCount, 0);
  const totalStockRevenue = stockItems.reduce((acc, item) => acc + (item.salesCount * item.itemPrice), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalRecordedSales = cashDetails.handSales + cashDetails.gpaySales;

  let html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; }
    h1 { text-align: center; color: #1e3a8a; font-size: 16pt; margin-top: 15px; margin-bottom: 5px; font-weight: bold; }
    h2 { text-align: center; color: #475569; font-size: 11pt; margin-top: 0; margin-bottom: 25px; }
    h3 { text-align: left; color: #1e293b; font-size: 12pt; margin-top: 10px; margin-bottom: 8px; font-weight: bold; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; }
    
    table { border-collapse: collapse; margin: 10px auto; width: 100%; max-width: 900px; font-size: 10pt; }
    
    /* Force row heights to exactly 20pt */
    tr { height: 20pt; }
    th { background-color: #3b82f6; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; text-align: center; height: 20pt; font-size: 10pt; padding: 0 10px; }
    td { border: 1px solid #cbd5e1; text-align: center; height: 20pt; font-size: 10pt; padding: 0 10px; }
    
    .footer-row { background-color: #f1f5f9; font-weight: bold; }
    .label-cell { background-color: #f8fafc; font-weight: 600; text-align: center; }
    
    /* Spacer table helper style to ensure clean rendering in Excel */
    .spacer-table { border: none; margin: 0 auto; border-collapse: collapse; }
    .spacer-cell { border: none; height: 20pt; background-color: transparent; font-size: 1px; line-height: 1px; }
  </style>
</head>
<body>
  <h1>Daily Ledger Report</h1>
  <h2>Date: ${log.date} | Status: ${log.isCompleted ? 'Closed & Sealed' : 'Active Worksheet'}</h2>

  <h3>1. STOCK DETAILS</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: center;">S.No</th>
        <th style="text-align: center;">Item Name</th>
        <th style="text-align: center;">Opening Stock</th>
        <th style="text-align: center;">Refill Stock</th>
        <th style="text-align: center;">Balance Stock</th>
        <th style="text-align: center;">Sales Count</th>
        <th style="text-align: center;">Price (₹)</th>
        <th style="text-align: center;">Revenue (₹)</th>
      </tr>
    </thead>
    <tbody>
  `;

  stockItems.forEach((item, index) => {
    html += `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td style="text-align: center;">${item.itemName}</td>
        <td style="text-align: center;">${item.openStock}</td>
        <td style="text-align: center;">${item.refillStock}</td>
        <td style="text-align: center;">${item.balanceStock}</td>
        <td style="text-align: center;">${item.salesCount}</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00';">₹${item.itemPrice.toFixed(2)}</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold;">₹${(item.salesCount * item.itemPrice).toFixed(2)}</td>
      </tr>
    `;
  });

  html += `
      <tr class="footer-row">
        <td colspan="2" style="text-align: center; font-weight: bold;">Total Stock Metrics</td>
        <td style="text-align: center;">${stockItems.reduce((acc, item) => acc + item.openStock, 0)}</td>
        <td style="text-align: center;">${stockItems.reduce((acc, item) => acc + item.refillStock, 0)}</td>
        <td style="text-align: center;">${stockItems.reduce((acc, item) => acc + item.balanceStock, 0)}</td>
        <td style="text-align: center;">${totalStockSalesCount}</td>
        <td style="text-align: center;">-</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #1e3a8a;">₹${totalStockRevenue.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Empty Space Spacer Rows for Excel -->
  <table class="spacer-table">
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
  </table>

  <h3>2. CASH DETAILS</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: center;">Parameter</th>
        <th style="text-align: center;">Value (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="label-cell">Morning Opening Cash</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00';">₹${cashDetails.morningOpening.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label-cell">Hand Cash Sales</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00';">₹${cashDetails.handSales.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label-cell">GPay UPI Sales</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00';">₹${cashDetails.gpaySales.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label-cell" style="font-weight: bold; color: #1e3a8a;">Total Recorded Sales</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #1e3a8a;">₹${totalRecordedSales.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Empty Space Spacer Rows for Excel -->
  <table class="spacer-table">
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
  </table>

  <h3>3. EXPENSE LIST</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: center;">S.No</th>
        <th style="text-align: center;">Category</th>
        <th style="text-align: center;">Payment Method</th>
        <th style="text-align: center;">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
  `;

  if (expenses.length === 0) {
    html += `
      <tr>
        <td colspan="4" style="color: #64748b; font-style: italic; text-align: center;">No expenses recorded today</td>
      </tr>
    `;
  } else {
    expenses.forEach((exp, index) => {
      html += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="text-align: center;">${exp.category}</td>
          <td style="text-transform: uppercase; text-align: center;">${exp.paymentMethod}</td>
          <td style="text-align: center; mso-number-format:'\\₹#,##0.00';">₹${exp.amount.toFixed(2)}</td>
        </tr>
      `;
    });
  }

  html += `
      <tr class="footer-row">
        <td colspan="3" style="text-align: center; font-weight: bold;">Total Expenses</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #b91c1c;">₹${totalExpenses.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Empty Space Spacer Rows for Excel -->
  <table class="spacer-table">
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
  </table>

  <h3>4. PERFORMANCE SUMMARY</h3>
  <table>
    <thead>
      <tr>
        <th style="text-align: center;">Metric</th>
        <th style="text-align: center;">Formula</th>
        <th style="text-align: center;">Value (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="label-cell">Total Revenue (Sales)</td>
        <td style="text-align: center;">Hand Cash Sales + GPay UPI Sales</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #1e3a8a;">₹${totalRecordedSales.toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label-cell">Total Expenses</td>
        <td style="text-align: center;">Sum of all operational payouts</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #b91c1c;">₹${totalExpenses.toFixed(2)}</td>
      </tr>
      <tr style="font-weight: bold;">
        <td class="label-cell" style="background-color: #eff6ff;">Net Daily Profit</td>
        <td style="text-align: center; background-color: #eff6ff;">Total Revenue - Total Expenses</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; color: ${totalRecordedSales - totalExpenses >= 0 ? '#16a34a' : '#dc2626'}; background-color: #eff6ff; font-weight: bold;">₹${(totalRecordedSales - totalExpenses).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="label-cell">Computed Retail Inventory Sold</td>
        <td style="text-align: center;">Sum of (Sales Count × Item Retail Price)</td>
        <td style="text-align: center; mso-number-format:'\\₹#,##0.00'; font-weight: bold; color: #475569;">₹${totalStockRevenue.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <!-- Empty Space Spacer Rows for Excel -->
  <table class="spacer-table">
    <tr>
      <td class="spacer-cell">&nbsp;</td>
    </tr>
  </table>

  <h3>5. REMARKS & SPECIAL NOTES</h3>
  <div style="margin: 10px auto; width: 100%; max-width: 900px; border: 1px solid #cbd5e1; padding: 12px; background-color: #f8fafc; font-size: 10pt; text-align: center; border-radius: 8px;">
    ${log.notes ? log.notes.replace(/\n/g, '<br>') : 'No remarks or special notes entered for today.'}
  </div>

  <div style="margin-top: 30px; text-align: center; font-size: 8pt; color: #94a3b8;">
    Report generated on ${new Date().toLocaleString()} | Powered by LedgerHub Client Interface
  </div>
</body>
</html>`;

  return html;
}
