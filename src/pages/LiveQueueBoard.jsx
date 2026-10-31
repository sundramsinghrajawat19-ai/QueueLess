
import { useEffect, useState, useCallback } from "react";
import { socket } from "../socket";

const API = "http://localhost:3000/api";

export default function LiveQueueBoard({ onBack }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch live queue data from the backend
  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch(`${API}/tokens`);
      const data = await response.json();

      if (response.ok && data.success) {
        setTokens(data.tokens || []);
        console.log("Tokens received by React:", data.tokens.length);
console.log("Latest tokens:", data.tokens.slice(-2));
        setError("");
      } else {
        setError(data.message || "Could not load live queues.");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for real-time updates and keep a fallback refresh
  useEffect(() => {
    let active = true;

    const handleQueueUpdate = () => {
      if (active) {
        loadQueue();
      }
    };

    loadQueue();

    socket.on("queue-updated", handleQueueUpdate);

    const timer = setInterval(loadQueue, 5000);

    return () => {
      active = false;
      socket.off("queue-updated", handleQueueUpdate);
      clearInterval(timer);
    };
  }, [loadQueue]);

  // Group tokens by service and location
  const queues = Object.values(
    tokens.reduce((groups, token) => {
      const key = `${token.serviceId}-${token.location}`;

      if (!groups[key]) {
        groups[key] = {
          serviceId: token.serviceId,
          serviceName: token.serviceName,
          location: token.location,
          tokens: []
        };
      }

      groups[key].tokens.push(token);
      return groups;
    }, {})
  );

  return (
    <div className="dashboard-page">
      <nav className="join-navbar">
        <button className="back-button" onClick={onBack}>
          ← QueueLess
        </button>

        <span className="join-brand">Live Queue Board</span>
        <span className="join-step-label">Real-time updates</span>
      </nav>

      <main className="dashboard-main">
        <section className="dashboard-heading">
          <p className="join-eyebrow">LIVE QUEUE STATUS</p>

          <h1>
            Every queue, <span>at a glance.</span>
          </h1>

          <p>
            See the token being served, who's waiting, and who's next.
          </p>
        </section>

        {loading && <p>Loading live queues...</p>}

        {error && <p className="form-error">{error}</p>}

        {!loading && !error && queues.length === 0 && (
          <section className="dashboard-stat">
            <h2>No queues yet</h2>
            <p>Generate a token to see a queue appear here.</p>
          </section>
        )}

        <div className="steps-grid">
          {queues.map((queue) => {
            const ordered = [...queue.tokens].sort(
              (a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt) ||
                a.id - b.id
            );

            const called = ordered.find(
              (token) => token.status === "called"
            );

            const waiting = ordered.filter(
              (token) => token.status === "waiting"
            );

            const next = waiting[0];

            return (
              <article
                className="step-card"
                key={`${queue.serviceId}-${queue.location}`}
              >
                <span className="step-number">LIVE QUEUE</span>

                <h3>{queue.serviceName}</h3>
                <p>{queue.location}</p>

                <div className="queue-stats">
                  <div>
                    <span className="small-label">NOW SERVING</span>
                    <strong>{called?.tokenNumber || "—"}</strong>
                  </div>
                </div>

                <div className="queue-stats">
                  <div>
                    <span className="small-label">WAITING</span>
                    <strong>{waiting.length}</strong>
                  </div>

                  <div>
                    <span className="small-label">NEXT TOKEN</span>
                    <strong>{next?.tokenNumber || "—"}</strong>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-heading">
                    <span>Waiting list</span>
                    <strong>{waiting.length} people</strong>
                  </div>

                  {waiting.length === 0 ? (
                    <p>No customers waiting.</p>
                  ) : (
                    waiting.map((token) => (
                      <p key={token._id || token.id}>
                        <strong>{token.tokenNumber}</strong>
                        {" · "}
                        Position {(token.peopleAhead ?? 0) + 1}
                        {" · "}
                        {token.estimatedWait ?? 0} min
                      </p>
                    ))
                  )}

                  {waiting.length > 5 && (
                    <p>
                      And {waiting.length - 5} more waiting...
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
