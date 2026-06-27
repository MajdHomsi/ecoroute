import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Dashboard.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

const TRANSPORT_MODES = [
  { value: "car_petrol", label: "Car (Petrol)" },
  { value: "car_diesel", label: "Car (Diesel)" },
  { value: "car_electric", label: "Car (Electric)" },
  { value: "bus", label: "Bus" },
  { value: "train", label: "Train" },
  { value: "subway", label: "Subway" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "bicycle", label: "Bicycle" },
  { value: "walking", label: "Walking" },
  { value: "rideshare", label: "Rideshare" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ co2_this_week: 0, co2_this_month: 0, trips_logged: 0 });
  const [trips, setTrips] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    transport_mode: "car_petrol",
    distance_km: "",
    trip_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  // filters & pagination
  const [modeFilter, setModeFilter] = useState('all');
  const [startFilter, setStartFilter] = useState('');
  const [endFilter, setEndFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [expandedTrip, setExpandedTrip] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const params = {
        page,
        limit,
      };
      if (modeFilter && modeFilter !== 'all') params.transport_mode = modeFilter;
      if (startFilter) params.start_date = startFilter;
      if (endFilter) params.end_date = endFilter;

      const [summaryRes, tripsRes, breakdownRes] = await Promise.all([
        api.get("/trips/summary"),
        api.get("/trips", { params }),
        api.get("/trips/breakdown", { params: { start_date: startFilter, end_date: endFilter } }),
      ]);

      setSummary(summaryRes.data);
      setTrips(tripsRes.data.trips);
      setTotal(tripsRes.data.pagination?.total || 0);
      setBreakdown(breakdownRes.data.breakdown || []);
    } catch (err) {
      console.error(err);
      setError("Could not load your data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // refetch when filters or page change
    fetchData();
  }, [modeFilter, startFilter, endFilter, page, limit]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.distance_km || form.distance_km <= 0) {
      return setError("Enter a valid distance.");
    }

    try {
      setSubmitting(true);
      await api.post("/trips", {
        transport_mode: form.transport_mode,
        distance_km: parseFloat(form.distance_km),
        trip_date: form.trip_date,
      });
      setForm({ ...form, distance_km: "" });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not log trip.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      await fetchData();
    } catch (err) {
      setError("Could not delete trip.");
    }
  };

  const modeLabel = (value) => {
    const found = TRANSPORT_MODES.find((m) => m.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-logo">🌿 EcoRoute</div>
        <div className="nav-right">
          <span className="nav-user">Hi, {user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <h1 className="dash-title">Your Carbon Dashboard</h1>
        <p className="dash-sub">Track your trips and see your footprint in real time.</p>

        <div className="dash-cards">
          <div className="dash-card">
            <span className="card-icon">🚗</span>
            <div className="card-stat">{summary.co2_this_week} kg</div>
            <div className="card-label">CO₂ This Week</div>
          </div>
          <div className="dash-card">
            <span className="card-icon">📅</span>
            <div className="card-stat">{summary.co2_this_month} kg</div>
            <div className="card-label">CO₂ This Month</div>
          </div>
          <div className="dash-card">
            <span className="card-icon">🗺️</span>
            <div className="card-stat">{summary.trips_logged}</div>
            <div className="card-label">Trips Logged</div>
          </div>
        </div>

        {/* Trip logging form */}
        
        <div className="chart-card">
          <h2 className="section-title">CO₂ by Trip</h2>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div>
                <label>Mode</label>
                <select value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}>
                  <option value="all">All</option>
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Start</label>
                <input type="date" value={startFilter} onChange={(e) => { setStartFilter(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label>End</label>
                <input type="date" value={endFilter} onChange={(e) => { setEndFilter(e.target.value); setPage(1); }} />
              </div>
              <div>
                <label>Per page</label>
                <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value,10)); setPage(1); }}>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
              </div>
            </div>

            {trips.length === 0 ? (
            <p className="dash-loading">Log a trip to see your chart.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[...trips].reverse().map(t => ({
                date: new Date(t.trip_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                co2: parseFloat(t.co2e_kg)
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'kg CO₂', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} kg`, 'CO₂']} />
                <Bar dataKey="co2" fill="#1a7a4a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

          <div className="chart-card" style={{ marginTop: 16 }}>
            <h2 className="section-title">CO₂ by Transport Mode</h2>
            {breakdown.length === 0 ? (
              <p className="dash-loading">No data for breakdown.</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie dataKey="total_co2" data={breakdown} nameKey="transport_mode" cx="50%" cy="50%" outerRadius={80} label={(entry)=>modeLabel(entry.transport_mode)}>
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={["#1a7a4a","#2a9d8f","#e9c46a","#f4a261","#e76f51","#66c2a5","#8dd3c7","#bebada","#fb8072","#80b1d3"][index % 10]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} kg`, 'CO₂']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

        <div className="trip-form-card">
          <h2 className="section-title">Log a Trip</h2>
          {error && <div className="dash-error">{error}</div>}
          <form onSubmit={handleSubmit} className="trip-form">
            <div className="form-row">
              <div className="form-group">
                <label>Transport Mode</label>
                <select name="transport_mode" value={form.transport_mode} onChange={handleChange}>
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Distance (km)</label>
                <input
                  type="number"
                  name="distance_km"
                  placeholder="e.g. 12.5"
                  value={form.distance_km}
                  onChange={handleChange}
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="trip_date"
                  value={form.trip_date}
                  onChange={handleChange}
                />
              </div>

              <button type="submit" className="log-trip-btn" disabled={submitting}>
                {submitting ? "Logging..." : "Log Trip"}
              </button>
            </div>
          </form>
        </div>

        {/* Trip history */}
        <div className="trip-history-card">
          <h2 className="section-title">Trip History</h2>

          {loading ? (
            <p className="dash-loading">Loading...</p>
          ) : trips.length === 0 ? (
            <div className="dash-empty">
              <p>🌱 You haven't logged any trips yet.</p>
              <p>Use the form above to log your first trip!</p>
            </div>
          ) : (
            <>
            <table className="trip-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mode</th>
                  <th>Distance</th>
                  <th>CO₂</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip) => (
                  <React.Fragment key={trip.id}>
                    <tr>
                      <td>{new Date(trip.trip_date).toLocaleDateString()}</td>
                      <td>{modeLabel(trip.transport_mode)}</td>
                      <td>{trip.distance_km} km</td>
                      <td>{trip.co2e_kg} kg</td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="delete-btn" onClick={() => handleDelete(trip.id)}>
                          Delete
                        </button>
                        <button className="delete-btn" onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}>
                          {expandedTrip === trip.id ? 'Close' : 'Details'}
                        </button>
                      </td>
                    </tr>
                    {expandedTrip === trip.id && (
                      <tr className="trip-detail-row">
                        <td colSpan={5} style={{ background: '#f9f9f9' }}>
                          <div style={{ display: 'flex', gap: 24 }}>
                            <div><strong>Emission factor:</strong> {trip.emission_factor} kg/km</div>
                            <div><strong>CO₂ recorded:</strong> {trip.co2e_kg} kg</div>
                            <div><strong>Distance:</strong> {trip.distance_km} km</div>
                            <div><strong>Transport:</strong> {modeLabel(trip.transport_mode)}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
              <div>Showing page {page} of {Math.max(1, Math.ceil(total / limit))}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}>Next</button>
              </div>
            </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}