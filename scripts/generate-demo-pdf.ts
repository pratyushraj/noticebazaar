import { jsPDF } from 'jspdf';
import { writeFileSync } from 'fs';

const doc = new jsPDF('p', 'mm', 'a4'); // A4 size: 210mm x 297mm

const clinicName = 'Shree Ram Dental Care';
const doctorName = 'Dr. Nilmani';
const doctorDegree = 'B.D.S., M.D.S. | Reg. No. DMC/2015/04892';
const doctorTitle = 'Dental Surgeon & Specialist';
const clinicAddress = '4, Arya Kumar Rd, near Dinkar golambar, Machhua Toli, Patna, Bihar 800004';
const clinicPhone = '+91 72509 30765';
const clinicEmail = 'nilmanineel@gmail.com';
const patientName = 'Ramesh Kumar';
const patientPhone = '+91 98765 43210';
const nextFollowUp = '2026-06-25';

// ── COLOR PALETTE (Premium Teal / Gold Accent) ────────────────────────
const PRIMARY_TEAL = [15, 118, 110]; // #0F766E
const TEXT_DARK = [30, 41, 59];    // #1E293B
const TEXT_MUTED = [100, 116, 139]; // #64748B
const ACCENT_GOLD = [217, 119, 6];  // #D97706
const BG_LIGHT = [248, 250, 252];   // #F8FAFC
const BORDER_LIGHT = [226, 232, 240]; // #E2E8F0

// 1. Top Branded Bar
doc.setFillColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.rect(0, 0, 210, 12, 'F');

// 2. Gold Accent Line
doc.setFillColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
doc.rect(0, 12, 210, 1.5, 'F');

// 3. Clinic Info & Logo Placeholder/Icon
doc.setTextColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(22);
doc.text(clinicName, 15, 28);

doc.setFontSize(11);
doc.setFont('Helvetica', 'bold');
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.text(doctorName, 15, 34);

doc.setFontSize(9);
doc.setFont('Helvetica', 'normal');
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text(doctorDegree, 15, 38);
doc.text(doctorTitle, 15, 42);

// Right Side Contact Info
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(10);
doc.text(clinicPhone, 195, 28, { align: 'right' });

doc.setFont('Helvetica', 'normal');
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.setFontSize(9);
doc.text(clinicEmail, 195, 33, { align: 'right' });

const addrLines = doc.splitTextToSize(clinicAddress, 70);
doc.text(addrLines, 195, 38, { align: 'right' });

// 4. Header Separator
doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
doc.setLineWidth(0.5);
doc.line(15, 50, 195, 50);

// 5. Patient Details Card
doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
doc.rect(15, 55, 180, 24, 'F');
doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
doc.rect(15, 55, 180, 24, 'S');

// Left Column: Patient Info
doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text('PATIENT INFO', 20, 61);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(11);
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.text(patientName, 20, 67);

doc.setFont('Helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text(`Mobile: ${patientPhone}`, 20, 72);

// Right Column: Date & Follow Up
doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text('CONSULTATION DATE', 130, 61);

doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.text(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 130, 67);

if (nextFollowUp) {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text('FOLLOW UP DATE', 130, 72);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
  doc.text(new Date(nextFollowUp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), 162, 72);
}

// 6. Prescription section
doc.setTextColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.setFontSize(26);
doc.setFont('Helvetica', 'bold');
doc.text('Rx', 15, 95);

// Accent line next to Rx
doc.setDrawColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.setLineWidth(0.8);
doc.line(30, 93, 195, 93);

// Medications Title
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.setFontSize(11);
doc.setFont('Helvetica', 'bold');
doc.text('PRESCRIBED MEDICATIONS & INSTRUCTIONS', 15, 103);

// List Medications
doc.setFont('Helvetica', 'normal');
doc.setFontSize(10);
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

const prescriptionText = '1. Tab. Amoxicillin 500mg - 1 capsule twice daily for 5 days (After meals)\n2. Tab. Paracetamol 650mg - 1 tablet twice daily as needed for pain (SOS)\n3. Chlorhexidine Mouthwash - Rinse twice daily with 10ml for 1 minute';
const rxLines = doc.splitTextToSize(prescriptionText, 175);
doc.text(rxLines, 15, 111, { baseline: 'top', lineLeading: 6 });

// 7. Treatment plan & Billing (Modern card layout)
let currentY = 165;
doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
doc.setLineWidth(0.5);
doc.line(15, currentY - 5, 195, currentY - 5);

doc.setTextColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(12);
doc.text('Treatment Summary & Care Receipt', 15, currentY);

currentY += 6;

// Table Header
doc.setFillColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.rect(15, currentY, 180, 8, 'F');

doc.setTextColor(255, 255, 255);
doc.setFontSize(9);
doc.setFont('Helvetica', 'bold');
doc.text('PROCEDURE / TREATMENT DONE', 20, currentY + 5.5);
doc.text('TOOTH', 120, currentY + 5.5);
doc.text('AMOUNT (INR)', 160, currentY + 5.5);

currentY += 8;

// Table Rows
const estimateItems = [
  { procedure: 'Root Canal Treatment (RCT)', tooth: 14, cost: 3500 },
  { procedure: 'Composite Filling / Restoration', tooth: 15, cost: 1500 }
];
const calculatedSubtotal = 5000;
const estimateDiscount = 10;
const calculatedDiscountAmount = 500;
const calculatedGrandTotal = 4500;

doc.setFont('Helvetica', 'normal');
doc.setFontSize(9.5);
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);

estimateItems.forEach((item, idx) => {
  // Alternating row background for modern look
  if (idx % 2 === 1) {
    doc.setFillColor(BG_LIGHT[0], BG_LIGHT[1], BG_LIGHT[2]);
    doc.rect(15, currentY, 180, 8, 'F');
  }
  
  doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  doc.text(item.procedure, 20, currentY + 5.5);
  doc.text(item.tooth ? `Tooth ${item.tooth}` : '-', 120, currentY + 5.5);
  doc.text(`Rs. ${item.cost.toLocaleString('en-IN')}`, 160, currentY + 5.5);
  currentY += 8;
});

// Separator
doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
doc.line(15, currentY, 195, currentY);
currentY += 6;

// Totals block aligned right
doc.setFont('Helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text(`Subtotal:`, 140, currentY);
doc.text(`Rs. ${calculatedSubtotal.toLocaleString('en-IN')}`, 190, currentY, { align: 'right' });

currentY += 5;
if (calculatedDiscountAmount > 0) {
  doc.text(`Concession (${estimateDiscount}%):`, 140, currentY);
  doc.setTextColor(ACCENT_GOLD[0], ACCENT_GOLD[1], ACCENT_GOLD[2]);
  doc.text(`- Rs. ${calculatedDiscountAmount.toLocaleString('en-IN')}`, 190, currentY, { align: 'right' });
  currentY += 5;
}

doc.setFont('Helvetica', 'bold');
doc.setFontSize(10.5);
doc.setTextColor(PRIMARY_TEAL[0], PRIMARY_TEAL[1], PRIMARY_TEAL[2]);
doc.text(`Final Amount (Paid):`, 140, currentY);
doc.text(`Rs. ${calculatedGrandTotal.toLocaleString('en-IN')}`, 190, currentY, { align: 'right' });

// 8. Footer (Elegant Signature Block)
const footerY = 270;
doc.setDrawColor(BORDER_LIGHT[0], BORDER_LIGHT[1], BORDER_LIGHT[2]);
doc.setLineWidth(0.5);
doc.line(15, footerY - 15, 195, footerY - 15);

// Disclaimer
doc.setFont('Helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.text('This is a digitally generated prescription/receipt. No physical signature is required.', 15, footerY - 5);
doc.text('Shree Ram Dental Care · Thank you for letting us care for your smile.', 15, footerY);

// Signature Line
doc.setFont('Helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
doc.text("Doctor's Signature", 150, footerY - 5);
doc.setDrawColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
doc.line(150, footerY - 1, 195, footerY - 1);

// Write to file
const pdfBuffer = doc.output('arraybuffer');
writeFileSync('/Users/pratyushraj/.gemini/antigravity/brain/c05c4f4c-3852-4ef4-b881-8ccb1f3970cc/Rohan_Hinglish_Demo_Rx_Estimate.pdf', Buffer.from(pdfBuffer));
console.log('✅ Styled Demo PDF generated successfully.');
