import { useEffect, useState } from "react";

import API_URL from "../api";
export default function MyQueue({ onBack }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");

  async function cancelToken(tokenId) {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this token?"
    );

    if (!confirmCancel) return;

    try {
      const authToken = localStorage.getItem("queuelessToken");

      const response = await fetch(
        `${API_URL}/api/tokens/${tokenId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to cancel token.");
      }

      setTokens((currentTokens) =>
        currentTokens.map((token) =>
          token.id === tokenId
            ? { ...token, status: "cancelled" }
            : token
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function fetchMyTokens() {
      try {
        const authToken = localStorage.getItem("queuelessToken");

        const response = await fetch(`${API_URL}/api/tokens/my`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your queue.");
        }

        if (isActive) {
          const updatedTokens = data.tokens || [];

          setTokens(updatedTokens);
          setError("");

          const approachingToken = updatedTokens.find(
            (token) =>
              token.status === "waiting" &&
              token.peopleAhead > 0 &&
              token.peopleAhead <= 3
          );

          if (approachingToken) {
            setNotification(
              `Your turn is approaching! Only ${
                approachingToken.peopleAhead
              } ${
                approachingToken.peopleAhead === 1 ? "person" : "people"
              } ahead of your token ${approachingToken.tokenNumber}.`
            );
          } else {
            setNotification("");
          }
        }
      } catch (err) {
        if (isActive) {
          setError(
            err.message === "Failed to fetch"
              ? "Cannot connect to the server. Check that the backend is running."
              : err.message
          );
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchMyTokens();

    const interval = setInterval(fetchMyTokens, 5000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
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

        {notification && (
          <div className="queue-notification">
            <strong>QueueLess Update</strong>
            <p>{notification}</p>
          </div>
        )}

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

                  {token.status === "waiting" && (
                    <button
                      className="back-button"
                      onClick={() => cancelToken(token.id)}
                    >
                      Cancel Token
                    </button>
                  )}
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