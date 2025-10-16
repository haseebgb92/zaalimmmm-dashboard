// Simple test script to verify webhook endpoint
const testWebhook = async () => {
  const webhookUrl = 'https://zaalimmmm-dashboard.vercel.app/api/pos/webhook';
  
  const testPayload = {
    eventType: 'order_created',
    timestamp: new Date().toISOString(),
    data: {
      source: 'spot',
      orders: 1,
      grossAmount: 350.00,
      orderId: 'TEST-001',
      orderType: 'dine-in',
      paymentMethod: 'cash',
      items: [
        {
          productId: 'shawarma-1',
          quantity: 1,
          unitPrice: 350.00,
          subTotal: 350.00
        }
      ]
    }
  };

  try {
    console.log('Testing webhook endpoint...');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Response body:', responseData);
    
    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('❌ Webhook test error:', error);
  }
};

testWebhook();
