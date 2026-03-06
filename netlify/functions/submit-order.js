exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let orderData;

  // Parse the incoming request body
  try {
    orderData = JSON.parse(event.body);
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON in request body' }),
    };
  }

  // Validate required fields
  const { customerName, customerEmail, items, totalAmount } = orderData;

  if (!customerName || !customerEmail || !items || !totalAmount) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Missing required fields: customerName, customerEmail, items, totalAmount',
      }),
    };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Order must contain at least one item' }),
    };
  }

  // Build the order object
  const order = {
    id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    customerName,
    customerEmail,
    items,
    totalAmount,
    status: 'received',
    submittedAt: new Date().toISOString(),
  };

  try {
    // TODO: Persist the order (e.g. save to a database or send to an external API)
    // Example: await saveOrderToDatabase(order);
    // Example: await notifyFulfillmentService(order);

    console.log('New order received:', JSON.stringify(order));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Order submitted successfully!',
        orderId: order.id,
        status: order.status,
      }),
    };
  } catch (err) {
    console.error('Failed to process order:', err);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error. Please try again later.' }),
    };
  }
};
