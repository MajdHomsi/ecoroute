const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const authRouter = require('../routes/auth');

const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRouter);

describe('Auth routes', () => {
  it('returns 400 when login payload is missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
