import { socket } from "../socket";
import { useEffect, useState } from "react";

const API = "http://localhost:3000/api";

export default function TrackToken({ onBack }) {
  const [input, setInput] = useState("");
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  async function findToken(number = input) {
    const cleanNumber = number.trim().toUpperCase();

    if (!/^Q\d+$/.test(cleanNumber)) {
      setError("Enter a valid token number, such as Q001.");
      setToken(null);
      return;
    }

    setInput(cleanNumber);
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/tokens/track/${encodeURIComponent(cleanNumber)}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not find token.");
      }

      setToken(data.token);
      setTrackingNumber(cleanNumber);
    } catch (err) {
      setToken(null);
      setError(err.message || "Could not connect to QueueLess.");
    } finally {
      setLoading(false);
    }
  }

  

useEffect(() => {
  if (!trackingNumber) return;

  let active = true;

  async function loadToken() {
    try {
      const response = await fetch(
        `${API}/tokens/track/${encodeURIComponent(trackingNumber)}`
      );
      const data = await response.json();

      if (!active) return;

      if (response.ok && data.success) {
        setToken(data.token);
        setError("");
      } else {
        setError(data.message || "Could not refresh token information.");
      }
    } catch {
      if (active) {
        setError("Connection lost. Retrying automatically...");
      }
    }
  }

  const handleQueueUpdate = () => {
    if (active) {
      loadToken();
    }
  };

  loadToken();

  socket.on("queue-updated", handleQueueUpdate);

  const timer = setInterval(loadToken, 5000);

  return () => {
    active = false;
    socket.off("queue-updated", handleQueueUpdate);
    clearInterval(timer);
  };
}, [trackingNumber]);


  return (
    <div className="dashboard-page">
      <nav className="join-navbar">
        <button className="back-button" onClick={onBack}>
  ← QueueLess
</button>
        <span className="join-brand">Track Your Token</span>
        <span className="join-step-label">Live updates</span>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-heading">
          <p className="join-eyebrow">CUSTOMER TOKEN TRACKING</p>
          <h1>
            Know your <span>place in line.</span>
          </h1>
          <p>Enter your token number to check your queue status.</p>
        </section>

        <form
          className="dashboard-filters"
          onSubmit={(event) => {
            event.preventDefault();
            findToken();
          }}
        >
          <label>
            <span>Your token number</span>
            <input
              value={input}
              onChange={(event) =>
                setInput(event.target.value.toUpperCase())
              }
              placeholder="e.g. Q001"
              required
            />
          </label>

          <button
            className="generate-token-button"
            type="submit"
            disabled={loading}
          >
            {loading ? "Checking..." : "Track token →"}
          </button>
        </form>

        {error && <p className="form-error">{error}</p>}

        {token && (
          <section className="dashboard-stat" aria-live="polite">
            <p className="join-eyebrow">YOUR TOKEN</p>
            <h2 className="dashboard-token">{token.tokenNumber}</h2>

            <p>
              {token.serviceName} · {token.location}
            </p>

            <p>
              Status:{" "}
              <strong>{token.status.toUpperCase()}</strong>
            </p>

            {token.status === "waiting" && (
              <>
                <p>
                  Queue position: <strong>{token.position}</strong>
                </p>
                <p>
                  Estimated wait:{" "}
                  <strong>{token.estimatedWait} minutes</strong>
                </p>
              </>
            )}

            {token.status === "called" && (
              <p>
                Your turn has been called. Please proceed to the counter.
              </p>
            )}

            {token.status === "completed" && (
              <p>
                Your service is complete. Thank you for using QueueLess!
              </p>
            )}

            {token.status === "waiting" && (
              <p>
                Updates automatically every 5 seconds.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
