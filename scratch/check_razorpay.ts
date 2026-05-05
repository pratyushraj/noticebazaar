import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import path from 'path';

// Load from server/.env specifically
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

async function checkOrders() {
  const orderIds = ['order_SlqFUGMv0djKLb', 'order_SlpYI5Br3w0C7m'];
  for (const id of orderIds) {
    try {
      const order = await rzp.orders.fetch(id);
      const payments = await rzp.orders.fetchPayments(id);
      console.log(`Order ${id}:`, {
        status: order.status,
        amount: order.amount,
        payments: payments.items.map((p: any) => ({ id: p.id, status: p.status, amount: p.amount }))
      });
    } catch (e: any) {
      console.error(`Error fetching ${id}:`, e.message);
    }
  }
}

checkOrders();
