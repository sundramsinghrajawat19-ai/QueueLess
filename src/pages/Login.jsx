import { useState } from "react";

function Login({ onBack, onLogin }) {
  const [role, setRole] = useState("customer");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const endpoint = isRegister
        ? "http://localhost:3000/api/auth/register"
        : "http://localhost:3000/api/auth/login";

      const body = isRegister
        ? { name, email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong.");
        return;
      }

      if (isRegister && data.user?.role !== "customer") {
        setMessage("Registration is available for customers only.");
        return;
      }

      if (!isRegister && data.user.role !== role) {
        setMessage(`This account is not registered as ${role}.`);
        return;
      }

      localStorage.setItem("queuelessToken", data.token);
      localStorage.setItem("queuelessUser", JSON.stringify(data.user));

      onLogin(data.user);
    } catch (error) {
      setMessage(
        "Unable to connect to the server. Check that the backend is running."
      );
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
          <span className="small-label">
            {isRegister ? "JOIN QUEUELESS" : "WELCOME BACK"}
          </span>

          <h1>
            {isRegister ? (
              <>Create your <span>account.</span></>
            ) : (
              <>Login to <span>QueueLess.</span></>
            )}
          </h1>

          <p>
            {isRegister
              ? "Create an account to join and track queues."
              : "Access your queue and stay updated."}
          </p>

          {!isRegister && (
            <div className="login-role">
              <button
                type="button"
                className={role === "customer" ? "selected" : ""}
                onClick={() => {
                  setRole("customer");
                  setMessage("");
                }}
              >
                Customer
              </button>

              <button
                type="button"
                className={role === "staff" ? "selected" : ""}
                onClick={() => {
                  setRole("staff");
                  setMessage("");
                }}
              >
                Staff
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </>
            )}

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
              minLength={6}
              required
            />

            {message && <p className="login-message">{message}</p>}

            <button
              className="primary-button login-submit"
              disabled={loading}
            >
              {loading
                ? isRegister
                  ? "Creating account..."
                  : "Logging in..."
                : isRegister
                  ? "Create account"
                  : "Login"}
            </button>
          </form>

          <p className="login-note">
            {isRegister ? "Already have an account? " : "New customer? "}
            <button
              type="button"
              className="login-switch"
              onClick={() => {
                setIsRegister(!isRegister);
                setMessage("");
              }}
            >
              {isRegister ? "Login" : "Create an account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Login;