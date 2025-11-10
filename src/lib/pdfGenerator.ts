import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoicePDF = (invoice: any, userProfile: any) => {
  const doc = new jsPDF();
  
  // Add header
  doc.setFontSize(24);
  doc.setTextColor(59, 130, 246); // Blue color
  doc.text('INVOICE', 105, 20, { align: 'center' });
  
  // Add business info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('MobileSales Pro', 20, 35);
  if (userProfile?.business_name) {
    doc.text(userProfile.business_name, 20, 42);
  }
  doc.text(userProfile?.full_name || 'User', 20, 49);
  
  // Add invoice details box
  doc.setFillColor(245, 245, 245);
  doc.rect(120, 35, 70, 30, 'F');
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoice_number}`, 125, 42);
  doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 125, 49);
  doc.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, 125, 56);
  doc.text(`Status: ${invoice.status}`, 125, 63);
  
  // Add plan details
  doc.setFontSize(14);
  doc.text('Subscription Details', 20, 80);
  
  autoTable(doc, {
    startY: 85,
    head: [['Plan', 'Amount']],
    body: [
      [invoice.plan.toUpperCase(), `PKR ${invoice.amount}`]
    ],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] },
  });
  
  // Add total
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.text('Total Amount:', 120, finalY + 15);
  doc.setFontSize(16);
  doc.setTextColor(59, 130, 246);
  doc.text(`PKR ${invoice.amount}`, 120, finalY + 25);
  
  // Add payment instructions
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('Payment Instructions:', 20, finalY + 40);
  doc.text('1. Transfer to Bank Account or JazzCash/EasyPaisa', 20, finalY + 47);
  doc.text('2. Upload payment proof in your invoice page', 20, finalY + 54);
  doc.text('3. Wait for admin verification', 20, finalY + 61);
  
  // Add footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  doc.text('MobileSales Pro - Mobile Business Management System', 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`invoice-${invoice.invoice_number}.pdf`);
};
