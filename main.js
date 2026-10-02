const express = require('express');
const crypto = require('crypto');

const app = express();
const SECRET = process.env.PAYMENT_SECRET || '2FJRGhIAiatWMUETJSKfFQeCuLhRQSO6orygiwdDxBjuUGXye03LvKEEhXBcBLjScpEV5O29rCdh24HI15ABlhEnFDvwHtmge3Qd';

app.use('/api/payments/callback', express.raw({ type: '*/*' }));

app.post('/api/payments/callback', (req, res) => {
  const raw = req.body.toString('utf8');
  console.log('callback:', raw);

  const signature = req.headers['x-signature'];
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(raw)
    .digest('hex');

  if (!signature || !crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  )) {
    return res.status(403).json({ error: 'invalid signature' });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'invalid json' });
  }

  const orderId = data.order_id || data.payment_id;
  const status = data.status;

  if (!orderId) {
    return res.status(400).json({ error: 'order_id required' });
  }

  // TODO: БД, идемпотентность, обновление заказа

  res.status(200).json({ status: 'ok' });
});

app.listen(3000, () => console.log('Server started'));