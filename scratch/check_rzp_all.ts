import Razorpay from 'razorpay';

const rzp = new Razorpay({
  key_id: 'rzp_live_SlEMSIP2mfXZrN',
  key_secret: 'buTxBaGx7B8fYBKjBDFKXiT7',
});

async function check() {
  const brandId = 'a9569e73-cf93-4f7d-95a8-f3c857828b88';
  
  console.log('Checking Razorpay Orders for Brand ID:', brandId);
  try {
    const orders = await rzp.orders.all({ 'notes[brand_id]': brandId } as any);
    console.log('Found', orders.items.length, 'orders.');
    orders.items.forEach((o: any) => {
        console.log('---');
        console.log('Order ID:', o.id);
        console.log('Status:', o.status);
        console.log('Amount:', o.amount / 100);
        console.log('Created At:', new Date(o.created_at * 1000).toLocaleString());
        console.log('Notes:', JSON.stringify(o.notes));
    });

  } catch (err) {
    console.error('Error:', err);
  }
}

check();
