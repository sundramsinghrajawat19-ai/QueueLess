
import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:3000/api";

export default function QueueDashboard({ onBack }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  const loadTokens = useCallback(async () => {
    try {
      const response = await fetch(`${API}/tokens`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not load the queue.");
      }

      setTokens(data.tokens);
      setError("");
    } catch {
      setError("Cannot load queue. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTokens();
    const timer = setInterval(loadTokens, 5000);
    return () => clearInterval(timer);
  }, [loadTokens]);

  async function updateStatus(token, status) {
    setUpdating(token.id);
    setError("");

    try {
      const response = await fetch(
        `${API}/tokens/${token.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update token.");
      }

      await loadTokens();
    } catch (err) {
      setError(err.message || "Could not update the queue.");
    } finally {
      setUpdating(null);
    }
  }

  const waiting = tokens.filter(token => token.status === "waiting");
  const called = tokens.filter(token => token.status === "called");
  const completed = tokens.filter(token => token.status === "completed");

  async function callNext() {
    if (!waiting.length) return;

    const next = [...waiting].sort(
      (a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id
    )[0];

    await updateStatus(next, "called");
  }

  return (
    <div className="dashboard-page">
      <nav className="join-navbar">
        <button className="back-button" onClick={onBack}>
          ← QueueLess
        </button>
        <span className="join-brand">Live Queue Dashboard</span>
        <span className="join-step-label">Updates every 5 seconds</span>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-heading">
          <p className="join-eyebrow">QUEUE MANAGEMENT</p>
          <h1>
            Keep things <span>moving.</span>
          </h1>
          <p>Monitor tokens and manage the waiting line.</p>
        </section>

        <section className="dashboard-stats">
          <article className="dashboard-stat">
            <span>WAITING</span>
            <strong>{waiting.length}</strong>
          </article>
          <article className="dashboard-stat">
            <span>CALLED</span>
            <strong>{called.length}</strong>
          </article>
          <article className="dashboard-stat">
            <span>COMPLETED</span>
            <strong>{completed.length}</strong>
          </article>
        </section>

        <div className="dashboard-toolbar">
          <div>
            <h2>Queue tokens</h2>
            <p>Tokens are loaded from your database.</p>
          </div>
          <button
            className="generate-token-button"
            onClick={callNext}
            disabled={!waiting.length || updating !== null}
          >
            {updating !== null ? "Updating..." : "Call Next →"}
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <p className="dashboard-message">Loading queue...</p>}

        {!loading && !error && tokens.length === 0 && (
          <p className="dashboard-message">
            No tokens yet. Join a queue to see tokens here.
          </p>
        )}

        {!loading && tokens.length > 0 && (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Name</th>
                  <th>Service</th>
                  <th>Location</th>
                  <th>Position</th>
                  <th>Est. wait</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {[...tokens]
                  .sort(
                    (a, b) =>
                      new Date(a.createdAt) - new Date(b.createdAt) ||
                      a.id - b.id
                  )
                  .map(token => (
                    <tr key={token._id || token.id}>
                      <td className="dashboard-token">{token.tokenNumber}</td>
                      <td>{token.name}</td>
                      <td>{token.serviceName}</td>
                      <td>{token.location}</td>
                      <td>
                        {token.status === "waiting"
                          ? token.peopleAhead + 1
                          : "—"}
                      </td>
                      <td>
                        {token.status === "waiting"
                          ? `${token.estimatedWait} min`
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`queue-status status-${token.status}`}
                        >
                          {token.status}
                        </span>
                      </td>
                      <td>
                        {token.status === "waiting" && (
                          <button
                            className="dashboard-action"
                            disabled={updating !== null}
                            onClick={() => updateStatus(token, "called")}
                          >
                            Call
                          </button>
                        )}
                        {token.status === "called" && (
                          <button
                            className="dashboard-action"
                            disabled={updating !== null}
                            onClick={() => updateStatus(token, "completed")}
                          >
                            Complete
                          </button>
                        )}
                        {token.status === "completed" && "Done ✓"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <button className="back-button dashboard-back" onClick={onBack}>
          ← Back to home
        </button>
      </main>
    </div>
  );
}
