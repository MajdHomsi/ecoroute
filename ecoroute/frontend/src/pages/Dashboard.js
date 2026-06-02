import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <p className="dash-sub">In Progress.</p>

        <div className="dash-cards">
          <div className="dash-card">
            <span className="card-icon">🚗</span>
            <div className="card-stat">0 kg</div>
            <div className="card-label">CO₂ This Week</div>
          </div>
          <div className="dash-card">
            <span className="card-icon">📅</span>
            <div className="card-stat">0 kg</div>
            <div className="card-label">CO₂ This Month</div>
          </div>
          <div className="dash-card">
            <span className="card-icon">🗺️</span>
            <div className="card-stat">0</div>
            <div className="card-label">Trips Logged</div>
          </div>
        </div>

        <div className="dash-empty">
          <p>🌱 You haven't logged any trips yet.</p>
          <p>In Progress.</p>
        </div>
      </main>
    </div>
  );
}
