
import { useState } from "react";
import "./index.css";
import JoinQueue from "./pages/JoinQueue";

function App() {
  const [joined, setJoined] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  if (showJoin) {
  return <JoinQueue onBack={() => setShowJoin(false)} />;
}

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#">
          <span className="logo-icon">Q</span>
          QueueLess<span className="logo-dot">.</span>
        </a>

        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </div>

        <button onClick={() => setShowJoin(true)}>
  Join a queue
</button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              SMARTER WAITING STARTS HERE
            </div>

            <h1>
              Your time matters.
              <br />
              Your queue moves <span>smarter.</span>
            </h1>

            <p className="hero-description">
              Join a queue from anywhere, track your position in real time,
              and spend less time waiting and more time living.
            </p>

            <div className="hero-actions">
              <button
                className="primary-button"
                onClick={() => setShowJoin(true)}
              >
                Get your token <span>→</span>
              </button>
              <a className="secondary-button" href="#how-it-works">
                See how it works <span>↓</span>
              </a>
            </div>

            <div className="trust-row">
              <div className="avatar-stack">
                <span>R</span><span>A</span><span>S</span><span>M</span>
              </div>
              <p><strong>Less waiting.</strong> A better experience for everyone.</p>
            </div>
          </div>

          <div className="queue-visual">
            <div className="visual-glow"></div>
            <div className="queue-card">
              <div className="card-top">
                <div>
                  <span className="small-label">LIVE QUEUE PREVIEW</span>
                  <h3>City Care Clinic</h3>
                </div>
                <span className="live-badge"><span></span> LIVE</span>
              </div>

              <div className="token-box">
                <span className="small-label">YOUR TOKEN</span>
                <div className="token-number">A<span>024</span></div>
                <span className="token-status">You're in the queue <span>✓</span></span>
              </div>

              <div className="queue-stats">
                <div>
                  <span className="small-label">PEOPLE AHEAD</span>
                  <strong>03 <small>people</small></strong>
                </div>
                <div className="stat-divider"></div>
                <div>
                  <span className="small-label">EST. WAIT</span>
                  <strong>12 <small>min</small></strong>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-heading">
                  <span>Queue progress</span>
                  <strong>75%</strong>
                </div>
                <div className="progress-track"><div></div></div>
                <div className="progress-foot">
                  <span>You're getting closer</span><span>Almost there</span>
                </div>
              </div>

              <div className="next-notice">
                <span className="notice-icon">↗</span>
                <div>
                  <strong>Keep doing your thing.</strong>
                  <p>We'll keep your queue status updated.</p>
                </div>
              </div>
              <p className="demo-note">Illustrative preview · Sample queue data</p>
            </div>

            <div className="floating-chip chip-top">
              <span className="chip-icon">↻</span>
              <div><strong>Real-time updates</strong><small>No refreshing needed</small></div>
            </div>
            <div className="floating-chip chip-bottom">
              <span className="chip-check">✓</span>
              <div><strong>Your time, returned.</strong><small>Wait on your terms</small></div>
            </div>
          </div>
        </section>

        <section className="metrics" id="features">
          <div><strong>01</strong><span>Join from anywhere</span></div>
          <div><strong>02</strong><span>Know your wait time</span></div>
          <div><strong>03</strong><span>Get notified when it's close</span></div>
          <div><strong>04</strong><span>Never lose your place</span></div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading">
            <span className="small-label">SIMPLE BY DESIGN</span>
            <h2>Waiting should be the <span>easy part.</span></h2>
            <p>Three simple steps between you and a better queue experience.</p>
          </div>
          <div className="steps-grid">
            <article className="step-card">
              <span className="step-number">01</span>
              <div className="step-icon">⌕</div>
              <h3>Choose your service</h3>
              <p>Find a participating clinic, office, or service counter.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <div className="step-icon">▤</div>
              <h3>Get your token</h3>
              <p>Join the digital queue and see your position and estimated wait.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <div className="step-icon">↗</div>
              <h3>Arrive at the right time</h3>
              <p>Follow live updates and return when your turn is approaching.</p>
            </article>
          </div>
        </section>

        <section className="join-section" id="join">
          <div>
            <span className="small-label">YOUR NEXT TURN STARTS HERE</span>
            <h2>Make waiting work <span>for you.</span></h2>
            <p>This preview is ready for the next step: connecting real services and queues.</p>
          </div>
          <button className="primary-button" onClick={() => setJoined(true)}>
            {joined ? "You're on the demo list ✓" : "Try the demo"} <span>→</span>
          </button>
          {joined && <p className="demo-message">Demo interaction only. No real queue token has been created yet.</p>}
        </section>
      </main>

      <footer>
        <a className="logo" href="#"><span className="logo-icon">Q</span> QueueLess<span className="logo-dot">.</span></a>
        <p>Less waiting. More living.</p>
        <span>© 2026 QueueLess · Project demo</span>
      </footer>
    </div>
  );
}

export default App;
