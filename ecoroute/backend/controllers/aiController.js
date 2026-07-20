const Groq = require('groq-sdk');
const pool = require('../config/db');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (req, res) => {
  const userId = req.user.id;
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    // Get all user trips for context
    const result = await pool.query(
      `SELECT transport_mode, distance_km, co2e_kg, trip_date 
       FROM trips 
       WHERE user_id = $1 
       ORDER BY trip_date DESC`,
      [userId]
    );

    const trips = result.rows;
    const totalCO2 = trips.reduce((sum, t) => sum + parseFloat(t.co2e_kg), 0).toFixed(2);
    const tripSummary = trips.map(t =>
      `${new Date(t.trip_date).toLocaleDateString()} - ${t.transport_mode} - ${t.distance_km}km - ${t.co2e_kg}kg CO2`
    ).join('\n');

    const systemPrompt = `You are EcoRoute's AI carbon advisor. You help users understand and reduce their carbon footprint based on their trip data.

Here is the user's complete trip history:
${tripSummary || 'No trips logged yet.'}

Total CO2 emitted: ${totalCO2}kg across ${trips.length} trips.

You can answer questions about their specific trips, calculate totals, compare transport modes, give reduction tips, and provide insights. Be friendly, concise, and data-driven. If asked about specific data, reference their actual trips.`;

    // Build message history for context
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.1-8b-instant',
      max_tokens: 500,
    });

    const reply = completion.choices[0]?.message?.content || "I couldn't generate a response. Please try again.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('AI chat error:', err.message);
    return res.status(500).json({ error: 'Could not get a response.' });
  }
};

module.exports = { chat };