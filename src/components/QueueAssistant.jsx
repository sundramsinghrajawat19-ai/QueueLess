
import { useState } from "react";
import "./QueueAssistant.css";

const API = "http://localhost:3000";

function QueueAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Hi! I'm QueueLess AI. Ask me anything about digital queues."
    }
  ]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(e) {
    e.preventDefault();

    const question = message.trim();
    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { role: "user", text: question }
    ]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(`${API}/api/ai/public-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: question })
      });

      const data = await response.json();

      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          text: data.reply || data.message || "Sorry, I couldn't respond."
        }
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          role: "ai",
          text: "I couldn't connect. Please check if the backend is running."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="queue-assistant">
      {isOpen && (
        <div className="assistant-panel">
          <div className="assistant-header">
            <div>
              <strong>QueueLess AI</strong>
              <span>Ask about digital queues</span>
            </div>

            <button onClick={() => setIsOpen(false)}>×</button>
          </div>

          <div className="assistant-messages">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`assistant-message ${item.role}`}
              >
                {item.text}
              </div>
            ))}

            {loading && (
              <div className="assistant-message ai">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="assistant-form">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question..."
              maxLength={500}
            />

            <button type="submit" disabled={loading || !message.trim()}>
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        className="assistant-toggle"
        onClick={() => setIsOpen((previous) => !previous)}
      >
        {isOpen ? "Close AI" : "✦ Ask QueueLess AI"}
      </button>
    </div>
  );
}

export default QueueAssistant;
