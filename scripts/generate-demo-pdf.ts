import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

// Simulating the PDF generation in a Node context
const doc = new jsPDF();

const clinicName = 'Rohan Dental Hub & Clinic';
const doctorName = 'Dr. Rohan Sharma, B.D.S., M.D.S. (Orthodontist)';
const clinicAddress = '456, Health Sector, Indiranagar, Bengaluru, Karnataka';
const clinicPhone = '+91 98765 43210';
const patientName = 'Rohan Hinglish Demo';
const patientPhone = '+91 99999 99999';
const nextFollowUp = '2026-06-25';

// Draw Elegant Indian-style header block
// Primary green/teal medical branding
doc.setFillColor(15, 118, 110); // Teal primary color (typical for Indian clinics)
doc.rect(0, 0, 210, 8, 'F');

// Clinic Info Header
doc.setTextColor(15, 118, 110);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(22);
doc.text(clinicName, 15, 25);

doc.setFontSize(12);
doc.setFont('Helvetica', 'bold');
doc.setTextColor(71, 85, 105);
doc.text(doctorName, 15, 31);

doc.setFontSize(10);
doc.setFont('Helvetica', 'normal');
doc.setTextColor(100, 116, 139);
doc.text('Dental Surgeon & Specialist', 15, 36);

// Contact Info (Top Right)
doc.setTextColor(71, 85, 105);
doc.setFont('Helvetica', 'bold');
doc.text(`Phone: ${clinicPhone}`, 135, 25);
doc.setFont('Helvetica', 'normal');

const addressLines = doc.splitTextToSize(clinicAddress, 60);
doc.text(addressLines, 135, 30);

// Separator line
doc.setDrawColor(203, 213, 225);
doc.setLineWidth(1);
doc.line(15, 45, 195, 45);

// Patient Details Bar
doc.setFillColor(248, 250, 252);
doc.rect(15, 50, 180, 22, 'F');
doc.setDrawColor(226, 232, 240);
doc.rect(15, 50, 180, 22, 'S');

doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.text('PATIENT:', 20, 56);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.text(patientName, 40, 56);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.text('PHONE:', 20, 64);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.text(patientPhone, 40, 64);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.text('DATE:', 135, 56);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.text(new Date().toLocaleDateString('en-IN'), 155, 56);

if (nextFollowUp) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FOLLOW UP:', 135, 64);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(new Date(nextFollowUp).toLocaleDateString('en-IN'), 160, 64);
}

// Rx symbol typical of medical prescriptions
doc.setTextColor(15, 118, 110);
doc.setFontSize(32);
doc.setFont('Helvetica', 'bold');
doc.text('Rx', 15, 88);

// Prescription body
doc.setTextColor(30, 41, 59);
doc.setFontSize(11);
doc.setFont('Helvetica', 'normal');
const prescriptionText = '• Amoxicillin 500mg - 1 capsule twice daily for 5 days\n• Paracetamol 650mg - 1 tablet twice daily as needed\n• Warm saline rinses after 24 hours';
const rxLines = doc.splitTextToSize(prescriptionText, 175);
doc.text(rxLines, 15, 98);

// Treatment plan / Billing summary (if present)
let currentY = 160;
const estimateItems = [
  { procedure: 'Root Canal Treatment (RCT)', tooth: 14, cost: 3500 },
  { procedure: 'Composite Filling / Restoration', tooth: 15, cost: 1500 }
];
const calculatedSubtotal = 5000;
const estimateDiscount = 10;
const calculatedDiscountAmount = 500;
const calculatedGrandTotal = 4500;

doc.setDrawColor(203, 213, 225);
doc.line(15, currentY - 5, 195, currentY - 5);

doc.setTextColor(15, 118, 110);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(12);
doc.text('Treatment Plan & Invoice Summary', 15, currentY);

currentY += 8;
doc.setFillColor(241, 245, 249);
doc.rect(15, currentY - 4, 180, 7, 'F');

doc.setTextColor(71, 85, 105);
doc.setFontSize(9);
doc.setFont('Helvetica', 'bold');
doc.text('Procedure / Description', 20, currentY);
doc.text('Tooth', 120, currentY);
doc.text('Cost (INR)', 160, currentY);

currentY += 8;
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(30, 41, 59);

estimateItems.forEach((item) => {
  doc.text(item.procedure, 20, currentY);
  doc.text(item.tooth ? `Tooth ${item.tooth}` : '-', 120, currentY);
  doc.text(`₹${item.cost.toLocaleString('en-IN')}`, 160, currentY);
  currentY += 6;
});

doc.line(15, currentY, 195, currentY);
currentY += 6;

doc.setFont('Helvetica', 'bold');
doc.text(`Subtotal: ₹${calculatedSubtotal.toLocaleString('en-IN')}`, 125, currentY);
currentY += 5;
if (calculatedDiscountAmount > 0) {
  doc.text(`Discount (${estimateDiscount}%): -₹${calculatedDiscountAmount.toLocaleString('en-IN')}`, 125, currentY);
  currentY += 5;
}
doc.setTextColor(15, 118, 110);
doc.text(`Grand Total (Incl. GST): ₹${calculatedGrandTotal.toLocaleString('en-IN')}`, 125, currentY);

// Bottom Footer / Signature line
const footerY = 275;
doc.setDrawColor(203, 213, 225);
doc.line(15, footerY - 18, 195, footerY - 18);

doc.setFont('Helvetica', 'italic');
doc.setFontSize(8);
doc.setTextColor(148, 163, 184);
doc.text('This prescription is digitally generated. Keep smiling & maintain good oral hygiene.', 15, footerY);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(71, 85, 105);
doc.text('Doctor Signature / Stamp', 140, footerY - 8);
doc.line(140, footerY - 3, 195, footerY - 3);

// Write to file
const pdfBuffer = doc.output('arraybuffer');
writeFileSync('/Users/pratyushraj/.gemini/antigravity/brain/c05c4f4c-3852-4ef4-b881-8ccb1f3970cc/Rohan_Hinglish_Demo_Rx_Estimate.pdf', Buffer.from(pdfBuffer));
console.log('✅ Demo PDF generated successfully.');
