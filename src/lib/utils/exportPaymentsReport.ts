import { BrandDeal } from '@/types';
import { Expense } from '@/lib/hooks/useExpenses';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PaymentsReportData {
  brandDeals: BrandDeal[];
  expenses: Expense[];
  stats: {
    totalReceived: number;
    pending: number;
    thisMonth: number;
    totalExpenses: number;
    netIncome: number;
  };
  period: {
    startDate: string;
    endDate: string;
  };
}

export async function exportPaymentsReport(data: PaymentsReportData): Promise<void> {
  try {
    const { brandDeals, expenses, stats, period } = data;
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 7;

    // Helper function to add a new page if needed
    const checkNewPage = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Payments & Expenses Report', margin, yPos);
    yPos += 10;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Period: ${new Date(period.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${new Date(period.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPos);
    yPos += 5;
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPos);
    yPos += 15;

    // Summary Section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Financial Summary', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Received: ₹${stats.totalReceived.toLocaleString('en-IN')}`, margin, yPos);
    yPos += lineHeight;
    pdf.text(`Pending Payments: ₹${stats.pending.toLocaleString('en-IN')}`, margin, yPos);
    yPos += lineHeight;
    pdf.text(`This Month Earnings: ₹${stats.thisMonth.toLocaleString('en-IN')}`, margin, yPos);
    yPos += lineHeight;
    pdf.text(`Total Expenses: ₹${stats.totalExpenses.toLocaleString('en-IN')}`, margin, yPos);
    yPos += lineHeight;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Net Income: ₹${stats.netIncome.toLocaleString('en-IN')}`, margin, yPos);
    yPos += 12;

    // Brand Deals Section
    if (brandDeals.length > 0) {
      checkNewPage(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Brand Deals & Payments', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Brand', margin, yPos);
      pdf.text('Amount', margin + 60, yPos);
      pdf.text('Status', margin + 100, yPos);
      pdf.text('Date', margin + 140, yPos);
      yPos += 6;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      brandDeals.forEach((deal) => {
        checkNewPage(10);
        const brandName = deal.brand_name.length > 20 ? deal.brand_name.substring(0, 20) + '...' : deal.brand_name;
        const amount = `₹${deal.deal_amount.toLocaleString('en-IN')}`;
        const status = deal.status || 'N/A';
        const date = deal.payment_received_date 
          ? new Date(deal.payment_received_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : deal.payment_expected_date
          ? new Date(deal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'N/A';

        pdf.text(brandName, margin, yPos);
        pdf.text(amount, margin + 60, yPos);
        pdf.text(status, margin + 100, yPos);
        pdf.text(date, margin + 140, yPos);
        yPos += lineHeight;
      });
      yPos += 10;
    }

    // Expenses Section
    if (expenses.length > 0) {
      checkNewPage(20);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Expenses', margin, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Category', margin, yPos);
      pdf.text('Amount', margin + 50, yPos);
      pdf.text('Date', margin + 90, yPos);
      pdf.text('Description', margin + 130, yPos);
      yPos += 6;

      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      expenses.forEach((expense) => {
        checkNewPage(10);
        const category = expense.category.length > 15 ? expense.category.substring(0, 15) + '...' : expense.category;
        const amount = `₹${expense.amount.toLocaleString('en-IN')}`;
        const date = new Date(expense.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const description = expense.description 
          ? (expense.description.length > 20 ? expense.description.substring(0, 20) + '...' : expense.description)
          : '-';

        pdf.text(category, margin, yPos);
        pdf.text(amount, margin + 50, yPos);
        pdf.text(date, margin + 90, yPos);
        pdf.text(description, margin + 130, yPos);
        yPos += lineHeight;
      });
    }

    // Footer on last page
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `Page ${i} of ${totalPages} - CreatorArmour Payments Report`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Save PDF
    const filename = `Payments-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
    toast.success('Report exported successfully!', {
      description: `Downloaded ${filename}`,
    });
  } catch (error: any) {
    console.error('Error exporting payments report:', error);
    toast.error('Failed to export report', { description: error.message });
    throw error;
  }
}

export function exportPaymentsCSV(data: PaymentsReportData): void {
  try {
    const { brandDeals, expenses, stats } = data;
    let csvContent = 'CreatorArmour Payments & Expenses Report\n';
    csvContent += `Generated: ${new Date().toLocaleDateString('en-US')}\n\n`;

    // Summary
    csvContent += 'Financial Summary\n';
    csvContent += `Total Received,₹${stats.totalReceived.toLocaleString('en-IN')}\n`;
    csvContent += `Pending Payments,₹${stats.pending.toLocaleString('en-IN')}\n`;
    csvContent += `This Month Earnings,₹${stats.thisMonth.toLocaleString('en-IN')}\n`;
    csvContent += `Total Expenses,₹${stats.totalExpenses.toLocaleString('en-IN')}\n`;
    csvContent += `Net Income,₹${stats.netIncome.toLocaleString('en-IN')}\n\n`;

    // Brand Deals
    csvContent += 'Brand Deals\n';
    csvContent += 'Brand Name,Amount,Status,Payment Date,Expected Date\n';
    brandDeals.forEach((deal) => {
      const brandName = `"${deal.brand_name}"`;
      const amount = deal.deal_amount;
      const status = deal.status || 'N/A';
      const receivedDate = deal.payment_received_date || '';
      const expectedDate = deal.payment_expected_date || '';
      csvContent += `${brandName},${amount},${status},${receivedDate},${expectedDate}\n`;
    });
    csvContent += '\n';

    // Expenses
    csvContent += 'Expenses\n';
    csvContent += 'Category,Amount,Date,Description,Vendor,Payment Method\n';
    expenses.forEach((expense) => {
      const category = `"${expense.category}"`;
      const amount = expense.amount;
      const date = expense.expense_date;
      const description = `"${expense.description || ''}"`;
      const vendor = `"${expense.vendor_name || ''}"`;
      const paymentMethod = expense.payment_method || '';
      csvContent += `${category},${amount},${date},${description},${vendor},${paymentMethod}\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payments-Report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV report exported successfully!');
  } catch (error: any) {
    console.error('Error exporting CSV:', error);
    toast.error('Failed to export CSV report', { description: error.message });
    throw error;
  }
}

