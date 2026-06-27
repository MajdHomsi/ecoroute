const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const tripsRouter = require('../routes/trips');
const authMiddleware = require('../middleware/auth');

const app = express();
app.use(bodyParser.json());
app.use('/api/trips', authMiddleware, tripsRouter);

describe('Trips routes', () => {
  it('returns 401 when no auth header is provided', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.statusCode).toBe(401);
  });
});
