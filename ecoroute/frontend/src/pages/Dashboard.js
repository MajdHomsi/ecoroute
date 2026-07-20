import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Dashboard.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from "recharts";

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

const PIE_COLORS = ["#1a7a4a","#2a9d8f","#e9c46a","#f4a261","#e76f51","#66c2a5","#8dd3c7","#bebada","#fb8072","#80b1d3"];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState({ co2_this_week: 0, co2_this_month: 0, trips_logged: 0 });
  const [trips, setTrips] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    transport_mode: "car_petrol",
    distance_km: "",
    trip_date: new Date().toISOString().split("T")[0],
  });
  const [submitting, setSubmitting] = useState(false);

  const [modeFilter, setModeFilter] = useState("all");
  const [startFilter, setStartFilter] = useState("");
  const [endFilter, setEndFilter] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [expandedTrip, setExpandedTrip] = useState(null);
  const [editTrip, setEditTrip] = useState(null);
  const [editForm, setEditForm] = useState({ transport_mode: "", distance_km: "", trip_date: "" });
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (modeFilter && modeFilter !== "all") params.transport_mode = modeFilter;
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

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchData(); }, [modeFilter, startFilter, endFilter, page, limit]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.distance_km || form.distance_km <= 0) return setError("Enter a valid distance.");
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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trips/${editTrip.id}`, {
        transport_mode: editForm.transport_mode,
        distance_km: parseFloat(editForm.distance_km),
        trip_date: editForm.trip_date,
      });
      setEditTrip(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.error || "Could not update trip.");
    }
  };

  const handleChatSend = async (overrideMessage) => {
    const message = overrideMessage || chatInput.trim();
    if (!message) return;

    const userMsg = { role: "user", content: message };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setAiLoading(true);

    try {
      const res = await api.post("/ai/chat", {
        message,
        history: updatedHistory.slice(-6).map(m => ({ role: m.role, content: m.content }))
      });
      setChatHistory([...updatedHistory, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      setChatHistory([...updatedHistory, { role: "assistant", content: "Sorry, I couldn't get a response. Please try again." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const modeLabel = (value) => {
    const found = TRANSPORT_MODES.find((m) => m.value === value);
    return found ? found.label : value;
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-logo">EcoRoute</div>
        <div className="nav-right">
          <span className="nav-user">{user?.name}</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <p className="dash-welcome">Welcome back, {user?.name}</p>
        <h1 className="dash-title">Carbon Dashboard</h1>
        <p className="dash-sub">Track your trips and monitor your footprint in real time.</p>

        {/* Stat cards */}
        <div className="dash-cards">
          <div className="dash-card">
            <div>
              <div className="card-stat">{summary.co2_this_week} kg</div>
              <div className="card-label">CO₂ This Week</div>
            </div>
          </div>
          <div className="dash-card">
            <div>
              <div className="card-stat">{summary.co2_this_month} kg</div>
              <div className="card-label">CO₂ This Month</div>
            </div>
          </div>
          <div className="dash-card">
            <div>
              <div className="card-stat">{summary.trips_logged}</div>
              <div className="card-label">Trips Logged</div>
            </div>
          </div>
        </div>

        {/* Log a trip */}
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
                <input type="number" name="distance_km" placeholder="e.g. 12.5"
                  value={form.distance_km} onChange={handleChange} min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" name="trip_date" value={form.trip_date} onChange={handleChange} />
              </div>
              <button type="submit" className="log-trip-btn" disabled={submitting}>
                {submitting ? "Logging..." : "Log Trip"}
              </button>
            </div>
          </form>
        </div>

        {/* Charts side by side */}
        <div className="charts-row">
          <div className="chart-card">
            <h2 className="section-title">CO₂ by Trip</h2>
            {trips.length === 0 ? (
              <p className="dash-loading">Log a trip to see your chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[...trips].reverse().map(t => ({
                  date: new Date(t.trip_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                  co2: parseFloat(t.co2e_kg)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip formatter={(value) => [`${value} kg`, "CO₂"]} />
                  <Bar dataKey="co2" fill="#1a7a4a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-card">
            <h2 className="section-title">CO₂ by Transport Mode</h2>
            {breakdown.length === 0 ? (
              <p className="dash-loading">No breakdown data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie dataKey="total_co2" data={breakdown} nameKey="transport_mode"
                    cx="50%" cy="50%" outerRadius={65} label={false}>
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} kg`, "CO₂"]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Trip history */}
        <div className="trip-history-card">
          <h2 className="section-title">Trip History</h2>
          <div className="filters-row">
            <div className="filter-group">
              <label>Mode</label>
              <select value={modeFilter} onChange={(e) => { setModeFilter(e.target.value); setPage(1); }}>
                <option value="all">All</option>
                {TRANSPORT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>From</label>
              <input type="date" value={startFilter} onChange={(e) => { setStartFilter(e.target.value); setPage(1); }} />
            </div>
            <div className="filter-group">
              <label>To</label>
              <input type="date" value={endFilter} onChange={(e) => { setEndFilter(e.target.value); setPage(1); }} />
            </div>
            <div className="filter-group">
              <label>Per page</label>
              <select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p className="dash-loading">Loading...</p>
          ) : trips.length === 0 ? (
            <div className="dash-empty">
              <p>No trips found. Log a trip using the form above.</p>
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
                        <td>
                          <div className="trip-actions">
                            <button className="details-btn"
                              onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}>
                              {expandedTrip === trip.id ? "Close" : "Details"}
                            </button>
                            <button className="edit-btn" onClick={() => {
                              setEditTrip(trip);
                              setEditForm({
                                transport_mode: trip.transport_mode,
                                distance_km: trip.distance_km,
                                trip_date: trip.trip_date?.split("T")[0],
                              });
                            }}>
                              Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDelete(trip.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedTrip === trip.id && (
                        <tr className="trip-detail-row">
                          <td colSpan={5}>
                            <div style={{ display: "flex", gap: 24 }}>
                              <span><strong>Transport:</strong> {modeLabel(trip.transport_mode)}</span>
                              <span><strong>Distance:</strong> {trip.distance_km} km</span>
                              <span><strong>CO₂:</strong> {trip.co2e_kg} kg</span>
                              {trip.emission_factor && <span><strong>Factor:</strong> {trip.emission_factor} kg/km</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              <div className="pagination-row">
                <span>Page {page} of {totalPages}</span>
                <div className="pagination-btns">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Floating Chat Widget */}
      <div className="chat-widget">
        {!chatOpen && (
          <div className="chat-teaser" onClick={() => setChatOpen(true)}>
            <span className="chat-teaser-dot"></span>
            Talk to your Carbon Coach
          </div>
        )}
        <button className="chat-toggle" onClick={() => setChatOpen(!chatOpen)}>
          {chatOpen ? "✕" : "🌿"}
        </button>
        {chatOpen && (
          <div className="chat-box">
<div className="chat-box-header">
              <span>🌿 Carbon Coach</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {chatHistory.length > 0 && (
                  <button onClick={() => setChatHistory([])} style={{ fontSize: 11, opacity: 0.7, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>Clear</button>
                )}
                <button onClick={() => setChatOpen(false)}>✕</button>
              </div>
            </div>
<div className="ai-messages">
              {chatHistory.length === 0 && (
                <div className="ai-empty">
                  <p>Ask me anything about your trips!</p>
                  <div className="ai-suggestions">
                    <button className="ai-suggestion" onClick={() => handleChatSend("Give me tips to reduce my carbon footprint")}>Give me tips</button>
                    <button className="ai-suggestion" onClick={() => handleChatSend("What is my total CO2 this month?")}>CO2 this month?</button>
                    <button className="ai-suggestion" onClick={() => handleChatSend("Which transport mode do I use most?")}>Most used mode?</button>
                  </div>
                </div>
              )}
              {chatHistory.length > 0 && (
                <div className="ai-suggestions" style={{ marginBottom: 8 }}>
                  <button className="ai-suggestion" onClick={() => handleChatSend("Give me more tips")}>More tips</button>
                  <button className="ai-suggestion" onClick={() => handleChatSend("Which was my highest CO2 trip?")}>Highest CO2 trip?</button>
                  <button className="ai-suggestion" onClick={() => handleChatSend("How can I improve next month?")}>Improve next month?</button>
                  <button className="ai-suggestion" style={{ borderColor: 'rgba(220,38,38,0.3)', color: '#f87171' }} onClick={() => setChatHistory([])}>End chat</button>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`ai-message ${msg.role}`}>
                  <div className="ai-bubble" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                </div>
              ))}
              {aiLoading && (
                <div className="ai-message assistant">
                  <div className="ai-bubble ai-typing">Thinking...</div>
                </div>
              )}
            </div>
            <div className="ai-input-row">
              <input
                type="text"
                className="ai-input"
                placeholder="Ask about your trips..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
              />
              <button className="ai-btn" onClick={() => handleChatSend()} disabled={aiLoading || !chatInput.trim()}>
                Send
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editTrip && (
        <div className="modal-overlay" onClick={() => setEditTrip(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="section-title">Edit Trip</h2>
            <form onSubmit={handleEditSubmit} className="trip-form">
              <div className="form-group">
                <label>Transport Mode</label>
                <select value={editForm.transport_mode}
                  onChange={(e) => setEditForm({ ...editForm, transport_mode: e.target.value })}>
                  {TRANSPORT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number"
                  value={editForm.distance_km}
                  onChange={(e) => setEditForm({ ...editForm, distance_km: e.target.value })}
                  min="0" step="0.1" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date"
                  value={editForm.trip_date}
                  onChange={(e) => setEditForm({ ...editForm, trip_date: e.target.value })} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button type="submit" className="log-trip-btn">Save Changes</button>
                <button type="button" className="details-btn" onClick={() => setEditTrip(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}