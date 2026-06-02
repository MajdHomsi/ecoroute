const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Database ─────────────────────────────────────────────────────────────────
require('./config/db'); // Connect on startup

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🌿 EcoRoute API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EcoRoute backend running on http://localhost:${PORT}`);
});
