import * as fs from 'fs';
import * as path from 'path';

const csvPath = '/Users/pratyushraj/Downloads/emails-sent-1779038777813.csv';

const targetBrands = [
  { name: 'TailBlaze', emails: ['hello@tailblaze.com', 'info@tailblaze.in'] },
  { name: 'Pawpeye', emails: ['pawpeye@gmail.com', 'contact@pawpeye.com'] },
  { name: 'RayTails', emails: ['hello@raytails.com', 'care@raytails.com'] },
  { name: 'Venttura', emails: ['info@venttura.in', 'support@venttura.in'] },
  { name: 'Dogkart', emails: ['support@dogkart.in', 'care@dogkart.in'] },
  { name: "Ollie's Paw", emails: ['hello@olliespaw.com', 'info@olliespaw.com'] },
  { name: 'Healthy Master', emails: ['support@healthymaster.in'] },
  { name: 'Makhana Break', emails: ['info@makhanabreak.com', 'bhoomikasingh90bs@gmail.com'] },
  { name: 'Crispy Makhana', emails: ['sales@crispymakhana.com', 'info@crispymakhana.com'] },
  { name: 'Makhanix', emails: ['hello@makhanix.com', 'hello@makhanix.in'] },
  { name: 'Widour', emails: ['info@widour.com', 'support@widour.com'] },
  { name: 'Beyond Food', emails: ['hello@beyondfood.in', 'connect@beyondfoodbars.com'] },
  { name: 'Shivya Ayurveda', emails: ['info@shivyaayurveda.com'] },
  { name: 'Aarogya Jeevanam', emails: ['care@aarogyajeevanam.com', 'info@aarogyajeevanam.in'] },
  { name: '365veda', emails: ['hello@365veda.com'] },
  { name: 'Chetan Herbals', emails: ['info@chetanherbals.com'] },
  { name: 'Vaghveda', emails: ['care@vaghveda.com', 'support@vaghveda.com'] },
  { name: 'Nirogam', emails: ['info@nirogam.com', 'support@nirogam.com'] }
];

function analyze() {
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV File does not exist at: ${csvPath}`);
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n');

  console.log(`📊 Loaded ${lines.length} lines from CSV.`);

  const matches: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // A simple CSV split that handles potential commas inside quotes (basic, but sufficient for email fields)
    const columns = line.split(',');
    if (columns.length < 5) continue;

    const subject = columns[2] ? columns[2].toLowerCase() : '';
    const toEmail = columns[4] ? columns[4].toLowerCase() : '';
    const createdTime = columns[1] || '';

    // Check if it matches any target brand name or email
    for (const b of targetBrands) {
      const matchByName = subject.includes(b.name.toLowerCase());
      const matchByEmail = b.emails.some(email => toEmail.includes(email.toLowerCase()));

      if (matchByName || matchByEmail) {
        matches.push({
          lineNum: i + 1,
          brandName: b.name,
          toEmail: columns[4],
          subject: columns[2],
          sentAt: createdTime,
          status: columns[8] || 'Unknown'
        });
      }
    }
  }

  if (matches.length === 0) {
    console.log('✅ Checked! No previous sends detected for any B6, B7, or B8 brands in this historical CSV.');
  } else {
    console.log(`⚠️ Detected ${matches.length} matches in the history CSV:`);
    console.table(matches);
  }
}

analyze();
