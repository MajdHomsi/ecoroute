const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

require('./config/db');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/trips', require('./routes/trips'));


app.get('/', (req, res) => {
  res.json({ message: '🌿 EcoRoute API is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 EcoRoute backend running on http://localhost:${PORT}`);
});
