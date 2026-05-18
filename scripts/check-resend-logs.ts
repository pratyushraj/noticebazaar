import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(process.cwd(), '.env') });
dotenv.config({ path: join(process.cwd(), '.env.local') });

// Use verified active Resend API key
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_3vCFXaJL_Gt3Y2z8Qc2nakcz5YDkbK5uH';

const resend = new Resend(RESEND_API_KEY);

async function main() {
  console.log('🔍 Fetching recent sent email logs from Resend API...');

  try {
    // Fetch last 100 emails sent via Resend API
    const response = await resend.emails.list();

    if (!response.data || !response.data.data || response.data.data.length === 0) {
      console.log('⚠️ No emails found in your Resend outbox logs.');
      return;
    }

    const logs = response.data.data.map((item: any) => ({
      id: item.id,
      to: Array.isArray(item.to) ? item.to.join(', ') : item.to,
      subject: item.subject,
      created_at: item.created_at,
      status: item.status || 'Sent'
    }));

    console.log(`\n📧 RESEND OUTBOX LOGS (Showing last ${logs.length} dispatches):`);
    console.log(`========================================================================`);
    console.table(logs.slice(0, 15)); // Print last 15 for concise layout

    const counts = logs.reduce((acc: any, item: any) => {
      const dateStr = new Date(item.created_at).toDateString();
      acc[dateStr] = (acc[dateStr] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📊 DAILY OUTBOX VOLUME SUMMARY:`);
    console.table(counts);

  } catch (err: any) {
    console.error('❌ Failed to retrieve Resend logs:', err.message);
  }
}

main();
