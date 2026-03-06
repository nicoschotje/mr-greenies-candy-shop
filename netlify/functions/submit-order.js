const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let order;
  try {
    order = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { customerName, contact, items, total, note } = order;

  if (!customerName || !items || !total) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  // 1. Save order to Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .from('orders')
    .insert([{ customer_name: customerName, contact, items, total, note, status: 'new' }])
    .select();

  if (error) {
    console.error('Supabase error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  const orderId = data[0].id.slice(0, 8).toUpperCase();

  // 2. Send Telegram notification to owner
  const itemList = items.map(i => `\u2022 ${i.name} x${i.qty} \u2014 \u20B1${i.price}`).join('\n');
  const telegramText =
    `\ud83d\udecd\ufe0f *NEW ORDER \u2014 #${orderId}*\n\n` +
    `\ud83d\udc64 *Customer:* ${customerName}\n` +
    `\ud83d\udcde *Contact:* ${contact || 'Not provided'}\n\n` +
    `\ud83d\udce6 *Items:*\n${itemList}\n\n` +
    `\ud83d\udcb0 *Total:* \u20B1${total}\n` +
    (note ? `\ud83d\udcdd *Note:* ${note}\n` : '') +
    `\n\ud83d\udd50 ${new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`;

  try {
    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramText,
          parse_mode: 'Markdown'
        })
      }
    );
  } catch (tgErr) {
    console.error('Telegram error:', tgErr);
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ success: true, orderId })
  };
};
