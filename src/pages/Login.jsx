
import { useState } from "react";

function Login({ onBack, onLogin }) {
  const [role, setRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed.");
        return;
      }

      if (data.user.role !== role) {
        setMessage(`This account is not registered as ${role}.`);
        return;
      }

      localStorage.setItem("queuelessToken", data.token);
      localStorage.setItem("queuelessUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (error) {
      setMessage("Unable to connect to the server. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#" onClick={onBack}>
          <span className="logo-icon">Q</span>
          QueueLess<span className="logo-dot">.</span>
        </a>
        <button className="nav-button" onClick={onBack}>
          Back to home
        </button>
      </nav>

      <main className="login-page">
        <div className="login-card">
          <span className="small-label">WELCOME BACK</span>
          <h1>Login to <span>QueueLess.</span></h1>
          <p>Access your queue and stay updated.</p>

          <div className="login-role">
            <button
              type="button"
              className={role === "customer" ? "selected" : ""}
              onClick={() => setRole("customer")}
            >
              Customer
            </button>
            <button
              type="button"
              className={role === "staff" ? "selected" : ""}
              onClick={() => setRole("staff")}
            >
              Staff
            </button>
          </div>

          <form onSubmit={handleLogin}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />

            {message && <p className="login-message">{message}</p>}

            <button className="primary-button login-submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="login-note">
            New customer? Customer registration will be added next.
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;
