import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

async function checkRecentPayments() {
  try {
    const payments = await rzp.payments.all({
      from: Math.floor(Date.now() / 1000) - 86400, // last 24h
      count: 10
    });
    console.log(JSON.stringify(payments.items.map(p => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      order_id: p.order_id,
      notes: p.notes,
      created_at: new Date(p.created_at * 1000).toISOString()
    })), null, 2));
  } catch (e: any) {
    console.error(e);
  }
}

checkRecentPayments();
