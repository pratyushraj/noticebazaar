import { jsPDF } from 'jspdf';
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const logoPath = join(__dirname, '..', 'public', 'assets', 'shree_ram_logo.png');
let logoBase64 = '';
try {
  const logoBuffer = readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
} catch (e) {
  console.warn('Failed to load logo image:', e);
}


const doc = new jsPDF({ unit: 'mm', format: 'a4' });
const PW = 210;
const PH = 297;

// ─── Palette ──────────────────────────────────────────────────────────────
const TEAL    = [10, 115, 105];
const TEAL_LT = [232, 249, 247];
const GOLD    = [192, 150, 60];
const DARK    = [22,  44,  58];
const GREY    = [100, 116, 130];
const WHITE   = [255, 255, 255];

// ─── Demo Data ─────────────────────────────────────────────────────────────
const clinicName    = 'SHREE RAM DENTAL CLINIC';
const doctorName    = 'Dr. Nilmani';
const credentials   = 'B.D.S., M.I.D.A.  |  Reg. No. Patna/2022/7762';
const speciality    = 'Dental Surgeon & Implantologist';
const clinicAddress = '4, Arya Kumar Rd, near Dinkar golambar, Machhua Toli, Patna, Bihar 800004';
const clinicPhone   = '+91 72509 30765';
const clinicEmail   = 'reception@shreeramdental.in';
const timing        = 'Mon–Sat  9:00 AM – 2:00 PM  |  Emergency: Available 24×7';
const patientName   = 'Rohan Sharma';
const patientPhone  = '+91 90123 45678';
const patientAge    = '32 yrs / Male';
const today         = '14 Jun 2026';
const followUp      = '28 Jun 2026';

const prescription  = [
  'Tab. Amoxicillin 500 mg — 1 tab thrice daily × 5 days (after food)',
  'Tab. Metronidazole 400 mg — 1 tab twice daily × 5 days',
  'Tab. Ibuprofen 400 mg — 1 tab SOS for pain (not more than 3/day)',
  'Chlorhexidine 0.2% Mouthwash — Rinse twice daily for 1 min after brushing',
  'Avoid hard/hot/cold foods for 48 hrs. Rest. Keep mouth clean.',
];

const estimateItems = [
  { procedure: 'Root Canal Treatment (RCT) — Tooth 14', tooth: '14', cost: 7080 },
  { procedure: 'Composite Filling / Restoration',        tooth: '26', cost: 1652 },
  { procedure: 'Dental X-Ray (IOPA)',                    tooth: '14', cost: 295  },
  { procedure: 'Scaling & Polishing (Full Mouth)',        tooth: '',   cost: 1180 },
];

const subtotal      = 8850;
const discountAmt   = 885;
const discountPct   = 10;
const grandTotal    = 9440;

// ─── HEADER BAND ────────────────────────────────────────────────────────────
doc.setFillColor(...GOLD);
doc.rect(0, 0, PW, 3.5, 'F');

doc.setFillColor(...TEAL);
doc.rect(0, 3.5, PW, 38, 'F');

doc.setFillColor(...WHITE);
doc.rect(0, 41.5, PW, 1.5, 'F');

// Logo circle / real logo image
if (logoBase64) {
  doc.addImage(logoBase64, 'PNG', 12, 10, 24, 24);
} else {
  const initials = 'SR';
  doc.setFillColor(...WHITE);
  doc.circle(24, 22, 12, 'F');
  doc.setTextColor(...TEAL);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(initials, 24, 25.5, { align: 'center' });
}


// Clinic name
doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(17);
doc.text(clinicName, 42, 17);

doc.setFontSize(10.5);
doc.text(doctorName, 42, 24);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(200, 235, 232);
doc.text(credentials, 42, 29.5);
doc.text(speciality,  42, 34.5);

const RX = PW - 12;
doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(8.5);
doc.text(`Ph:  ${clinicPhone}`, RX, 14, { align: 'right' });
doc.setFont('Helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(200, 235, 232);
const addrLines = doc.splitTextToSize(clinicAddress, 68);
doc.text(addrLines, RX, 20, { align: 'right' });
doc.text(clinicEmail, RX, 29, { align: 'right' });
doc.setFontSize(7);

doc.text(timing, RX, 34.5, { align: 'right' });

// ─── GOLD DIVIDER LABEL ─────────────────────────────────────────────────────
doc.setFillColor(...GOLD);
doc.rect(0, 43, PW, 6.5, 'F');
doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(8);
doc.text('PRESCRIPTION / MEDICAL RECEIPT', PW / 2, 47.5, { align: 'center' });

// ─── PATIENT INFO CARD ───────────────────────────────────────────────────────
doc.setFillColor(...TEAL_LT);
doc.roundedRect(12, 52, PW - 24, 24, 2, 2, 'F');
doc.setDrawColor(...TEAL);
doc.setLineWidth(0.4);
doc.roundedRect(12, 52, PW - 24, 24, 2, 2, 'S');

const label = (txt, x, y) => {
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEAL);
  doc.text(txt, x, y);
};
const value = (txt, x, y) => {
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text(txt, x, y);
};

label('PATIENT NAME', 18, 59);  value(patientName,  18, 64.5);
label('MOBILE',       18, 70.5); value(patientPhone, 18, 75);
label('DATE',         90, 59);   value(today,        90, 64.5);
label('NEXT FOLLOW-UP', 90, 70.5); value(followUp,   90, 75);
label('AGE / GENDER', 152, 59);  value(patientAge,   152, 64.5);

// ─── Rx SECTION ──────────────────────────────────────────────────────────────
let Y = 84;

doc.setTextColor(...TEAL);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(28);
doc.text('\u211E', 14, Y + 8);

doc.setDrawColor(...TEAL);
doc.setLineWidth(0.5);
doc.line(12, Y, PW - 12, Y);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(...TEAL);
doc.text('MEDICATIONS & CLINICAL NOTES', 30, Y + 5.5);

doc.setLineWidth(0.3);
doc.setDrawColor(...GOLD);
doc.line(30, Y + 7, 140, Y + 7);

Y += 14;

doc.setFont('Helvetica', 'normal');
doc.setFontSize(9.5);
doc.setTextColor(...DARK);

prescription.forEach((line, i) => {
  doc.setFont('Helvetica', 'bold');
  doc.setTextColor(...TEAL);
  doc.text(`${i + 1}.`, 15, Y);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(...DARK);
  const wrapped = doc.splitTextToSize(line, 168);
  doc.text(wrapped, 22, Y);
  Y += wrapped.length * 5.5 + 1.5;
});

// Dotted lines
doc.setLineDashPattern([0.8, 1.2], 0);
doc.setDrawColor(180, 200, 210);
doc.setLineWidth(0.3);
for (let iy = Y + 4; iy < 197; iy += 7) {
  doc.line(15, iy, PW - 15, iy);
}
doc.setLineDashPattern([], 0);

// ─── TREATMENT / BILLING TABLE ───────────────────────────────────────────────
Y = 200;

doc.setFillColor(...TEAL);
doc.roundedRect(12, Y, PW - 24, 8, 1.5, 1.5, 'F');
doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(9);
doc.text('TREATMENT PLAN & BILLING SUMMARY', PW / 2, Y + 5.5, { align: 'center' });

Y += 10;

doc.setFillColor(230, 246, 244);
doc.rect(12, Y, PW - 24, 7, 'F');
doc.setTextColor(...TEAL);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(8);
doc.text('#',                    16,  Y + 5);
doc.text('Procedure / Description', 22, Y + 5);
doc.text('Tooth',                120, Y + 5);
doc.text('Amount (Rs.)',           168, Y + 5, { align: 'right' });


Y += 8;

estimateItems.forEach((item, idx) => {
  if (idx % 2 === 0) {
    doc.setFillColor(250, 252, 252);
    doc.rect(12, Y - 1.5, PW - 24, 7, 'F');
  }
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DARK);
  doc.text(`${idx + 1}`,  16, Y + 4);
  const proc = doc.splitTextToSize(item.procedure, 94);
  doc.text(proc,          22, Y + 4);
  doc.text(item.tooth ? `T-${item.tooth}` : '—', 120, Y + 4);
  doc.text(item.cost.toLocaleString('en-IN'), 168, Y + 4, { align: 'right' });
  Y += Math.max(proc.length, 1) * 5 + 2;
});

doc.setDrawColor(...TEAL);
doc.setLineWidth(0.5);
doc.line(12, Y, PW - 12, Y);
Y += 5;

const totalsX = 130;
doc.setFont('Helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...GREY);
doc.text('Subtotal:',            totalsX, Y);
doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, PW - 14, Y, { align: 'right' });
Y += 5.5;

doc.setTextColor(200, 80, 80);
doc.text(`Discount (${discountPct}%):`, totalsX, Y);
doc.text(`- Rs. ${discountAmt.toLocaleString('en-IN')}`, PW - 14, Y, { align: 'right' });
Y += 5.5;

doc.setTextColor(...GREY);
doc.text('GST (18% incl.):', totalsX, Y);
const gstAmt = Math.round(grandTotal - grandTotal / 1.18);
doc.text(`Rs. ${gstAmt.toLocaleString('en-IN')}`, PW - 14, Y, { align: 'right' });
Y += 5.5;

doc.setFillColor(...TEAL);
doc.roundedRect(totalsX - 3, Y - 1, PW - totalsX - 9, 9, 1, 1, 'F');
doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'bold');
doc.setFontSize(9.5);
doc.text('GRAND TOTAL (Incl. GST):', totalsX, Y + 6);
doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, PW - 14, Y + 6, { align: 'right' });

// ─── SIGNATURE / STAMP ZONE ──────────────────────────────────────────────────
const sigY = PH - 38;
doc.setDrawColor(200, 215, 220);
doc.setLineWidth(0.3);
doc.line(12, sigY, PW - 12, sigY);

// Stamp circle placeholder (moved to center X=105 to avoid total overlap)
doc.setDrawColor(...TEAL);
doc.setLineWidth(0.5);
doc.setLineDashPattern([1.5, 1.5], 0);
doc.circle(105, sigY + 14, 12, 'S');
doc.setLineDashPattern([], 0);
doc.setTextColor(...TEAL);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(6.5);
doc.text('CLINIC',  105, sigY + 13, { align: 'center' });
doc.text('STAMP',   105, sigY + 17, { align: 'center' });

doc.setDrawColor(...DARK);
doc.setLineWidth(0.4);
doc.line(15, sigY + 24, 75, sigY + 24);

doc.setFont('Helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...DARK);
doc.text("Doctor's Signature", 15, sigY + 28.5);
doc.setFont('Helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...GREY);
doc.text(doctorName, 15, sigY + 33);

// ─── FOOTER ──────────────────────────────────────────────────────────────────
doc.setFillColor(...TEAL);
doc.rect(0, PH - 10, PW, 10, 'F');
doc.setFillColor(...GOLD);
doc.rect(0, PH - 11, PW, 1.5, 'F');

doc.setTextColor(...WHITE);
doc.setFont('Helvetica', 'italic');
doc.setFontSize(7);
doc.text(
  'This is a computer-generated prescription. No signature required. Keep this for your records. \u2665  Wishing you a speedy recovery!',
  PW / 2, PH - 4.5, { align: 'center' }
);

// ─── Save ────────────────────────────────────────────────────────────────────
const outPath = join(__dirname, '..', 'Rohan_Sharma_Prescription_Demo.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
writeFileSync(outPath, pdfBuffer);
console.log('PDF saved to:', outPath);
