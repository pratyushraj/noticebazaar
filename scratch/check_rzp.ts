import Razorpay from 'razorpay';
import dotenv from 'dotenv';

const rzp = new Razorpay({
  key_id: 'rzp_live_SlEMSIP2mfXZrN',
  key_secret: 'buTxBaGx7B8fYBKjBDFKXiT7',
});

async function check() {
  const orderId = 'order_SlzrdEn7lNZlnh';
  const dealId = '61f867a0-13cc-49e2-a875-c0922264aba8';
  
  console.log('Checking Razorpay Order:', orderId);
  try {
    const order = await rzp.orders.fetch(orderId);
    console.log('Order Status:', order.status);
    console.log('Order Details:', JSON.stringify(order, null, 2));
    
    console.log('\nChecking Payments for Order:', orderId);
    const payments = await rzp.orders.fetchPayments(orderId);
    console.log('Found', payments.items.length, 'payments.');
    payments.items.forEach((p: any) => {
        console.log('---');
        console.log('Payment ID:', p.id);
        console.log('Status:', p.status);
        console.log('Amount:', p.amount / 100);
        console.log('Card:', p.card?.last4 || 'N/A');
        console.log('Method:', p.method);
        console.log('Created At:', new Date(p.created_at * 1000).toLocaleString());
    });

    console.log('\nChecking Payments for Deal ID via notes:', dealId);
    const notesPayments = await rzp.payments.all({ 'notes[deal_id]': dealId } as any);
    console.log('Found', notesPayments.items.length, 'payments via notes.');
    notesPayments.items.forEach((p: any) => {
        console.log('---');
        console.log('Payment ID:', p.id);
        console.log('Status:', p.status);
        console.log('Amount:', p.amount / 100);
        console.log('Card:', p.card?.last4 || 'N/A');
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
