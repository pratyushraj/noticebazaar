/**
 * Export utilities for dashboard data
 */

interface ExportData {
  earnings?: number;
  payments?: Array<{
    brand: string;
    amount: number;
    date: string;
    status: string;
  }>;
  deals?: Array<{
    brand: string;
    amount: number;
    status: string;
    date: string;
  }>;
}

/**
 * Export dashboard data as CSV
 */
export function exportToCSV(data: ExportData, filename: string = 'dashboard-export') {
  let csv = '';
  
  if (data.earnings !== undefined) {
    csv += 'Earnings\n';
    csv += `Amount,${data.earnings}\n\n`;
  }
  
  if (data.payments && data.payments.length > 0) {
    csv += 'Payments\n';
    csv += 'Brand,Amount,Date,Status\n';
    data.payments.forEach((payment) => {
      csv += `"${payment.brand}",${payment.amount},"${payment.date}","${payment.status}"\n`;
    });
    csv += '\n';
  }
  
  if (data.deals && data.deals.length > 0) {
    csv += 'Deals\n';
    csv += 'Brand,Amount,Status,Date\n';
    data.deals.forEach((deal) => {
      csv += `"${deal.brand}",${deal.amount},"${deal.status}","${deal.date}"\n`;
    });
  }
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export dashboard data as JSON
 */
export function exportToJSON(data: ExportData, filename: string = 'dashboard-export') {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

