const pool = require('../config/db');
const { calculateCO2e, EMISSION_FACTORS } = require('../utils/co2Calculator');

const createTrip = async (req, res) => {
  const { transport_mode, distance_km, trip_date } = req.body;
  const userId = req.user.id;

  if (!transport_mode || !distance_km || !trip_date) {
    return res.status(400).json({ error: 'Transport mode, distance, and date are required.' });
  }

  if (!EMISSION_FACTORS.hasOwnProperty(transport_mode)) {
    return res.status(400).json({ error: 'Invalid transport mode.' });
  }

  if (distance_km <= 0) {
    return res.status(400).json({ error: 'Distance must be greater than 0.' });
  }

  try {
    const co2e = calculateCO2e(transport_mode, distance_km);

    const result = await pool.query(
      `INSERT INTO trips (user_id, transport_mode, distance_km, co2e_kg, trip_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, transport_mode, distance_km, co2e, trip_date]
    );

    return res.status(201).json({
      message: 'Trip logged successfully.',
      trip: result.rows[0]
    });
  } catch (err) {
    console.error('Create trip error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

const getTrips = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY trip_date DESC, created_at DESC',
      [userId]
    );

    return res.status(200).json({ trips: result.rows });
  } catch (err) {
    console.error('Get trips error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const getSummary = async (req, res) => {
  const userId = req.user.id;

  try {
    const weekResult = await pool.query(
      `SELECT COALESCE(SUM(co2e_kg), 0) as total
       FROM trips
       WHERE user_id = $1 AND trip_date >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    const monthResult = await pool.query(
      `SELECT COALESCE(SUM(co2e_kg), 0) as total
       FROM trips
       WHERE user_id = $1 AND trip_date >= NOW() - INTERVAL '30 days'`,
      [userId]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM trips WHERE user_id = $1',
      [userId]
    );

    return res.status(200).json({
      co2_this_week: parseFloat(weekResult.rows[0].total),
      co2_this_month: parseFloat(monthResult.rows[0].total),
      trips_logged: parseInt(countResult.rows[0].count)
    });
  } catch (err) {
    console.error('Get summary error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const updateTrip = async (req, res) => {
  const userId = req.user.id;
  const tripId = req.params.id;
  const { transport_mode, distance_km, trip_date } = req.body;

  if (!transport_mode || !distance_km || !trip_date) {
    return res.status(400).json({ error: 'Transport mode, distance, and date are required.' });
  }

  if (!EMISSION_FACTORS.hasOwnProperty(transport_mode)) {
    return res.status(400).json({ error: 'Invalid transport mode.' });
  }

  try {
    const existing = await pool.query(
      'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const co2e = calculateCO2e(transport_mode, distance_km);

    const result = await pool.query(
      `UPDATE trips
       SET transport_mode = $1, distance_km = $2, co2e_kg = $3, trip_date = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [transport_mode, distance_km, co2e, trip_date, tripId, userId]
    );

    return res.status(200).json({
      message: 'Trip updated successfully.',
      trip: result.rows[0]
    });
  } catch (err) {
    console.error('Update trip error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

const deleteTrip = async (req, res) => {
  const userId = req.user.id;
  const tripId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *',
      [tripId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    return res.status(200).json({ message: 'Trip deleted successfully.' });
  } catch (err) {
    console.error('Delete trip error:', err.message);
    return res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = { createTrip, getTrips, getSummary, updateTrip, deleteTrip };