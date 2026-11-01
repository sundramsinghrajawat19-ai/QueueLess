import { useEffect, useState } from "react";

export default function MyQueue({ onBack }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchMyTokens() {
      try {
        const authToken = localStorage.getItem("queuelessToken");

        const response = await fetch(
          "http://localhost:3000/api/tokens/my",
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your queue.");
        }

        setTokens(data.tokens || []);
      } catch (err) {
        setError(
          err.message === "Failed to fetch"
            ? "Cannot connect to the server. Please ensure the backend is running."
            : err.message
        );
      } finally {
        setLoading(false);
      }
    }

    fetchMyTokens();
  }, []);

  return (
    <div className="join-page">
      <nav className="join-navbar">
        <button className="back-button" onClick={onBack}>
          ← QueueLess
        </button>
        <span className="join-brand">QueueLess</span>
        <span className="join-step-label">My Queue</span>
      </nav>

      <main className="join-main">
        <section className="join-intro">
          <p className="join-eyebrow">YOUR QUEUE ACTIVITY</p>
          <h1>
            Your tokens.
            <br />
            <span>Your place in line.</span>
          </h1>
          <p>View the queue tokens linked to your account.</p>
        </section>

        {loading && <p>Loading your queue...</p>}

        {error && <p className="form-error">{error}</p>}

        {!loading && !error && tokens.length === 0 && (
          <section className="token-result">
            <h2>No queue tokens yet</h2>
            <p>Join a service queue to see your token here.</p>
          </section>
        )}

        {!loading &&
          !error &&
          tokens.map((token) => (
            <section className="token-result" key={token._id}>
              <div className="result-ticket">
                <p className="join-eyebrow">YOUR QUEUE TOKEN</p>
                <h2>{token.tokenNumber}</h2>
                <p>{token.serviceName}</p>

                <div className="ticket-details">
                  <p>
                    <strong>Location:</strong> {token.location}
                  </p>
                  <p>
                    <strong>People ahead:</strong> {token.peopleAhead}
                  </p>
                  <p>
                    <strong>Estimated wait:</strong>{" "}
                    {token.estimatedWait === 0
                      ? "You're next!"
                      : `${token.estimatedWait} minutes`}
                  </p>
                  <p>
                    <strong>Status:</strong> {token.status}
                  </p>
                </div>
              </div>
            </section>
          ))}

        <button className="back-button" onClick={onBack}>
          Back to home
        </button>
      </main>
    </div>
  );
}