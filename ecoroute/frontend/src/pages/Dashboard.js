import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Dashboard.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    transport_mode: "car_petrol",
    distance_km: "",
    trip_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryRes, tripsRes] = await Promise.all([
        api.get("/trips/summary"),
        api.get("/trips"),
      ]);
      setSummary(summaryRes.data);
      setTrips(tripsRes.data.trips);
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
                  <tr key={trip.id}>
                    <td>{new Date(trip.trip_date).toLocaleDateString()}</td>
                    <td>{modeLabel(trip.transport_mode)}</td>
                    <td>{trip.distance_km} km</td>
                    <td>{trip.co2e_kg} kg</td>
                    <td>
                      <button className="delete-btn" onClick={() => handleDelete(trip.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}