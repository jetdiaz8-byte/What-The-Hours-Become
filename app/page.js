'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  blankSession,
  elapsedSeconds,
  calculateEarnings,
  formatEarnings,
  formatTime,
  formatTimeShort,
  loadSession,
  saveSession,
  clearSession,
} from '../lib/timer';
import { assembleMotivation } from '../lib/motivation';

// ─── Setup screen ────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [rate, setRate] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const parsed = parseFloat(rate);
    if (!parsed || parsed <= 0) {
      setError('Please enter a valid hourly rate.');
      return;
    }
    onStart(parsed);
  }

  return (
    <div className="setup-screen">
      <div className="setup-inner">
        <p className="label-small">hourly rate (PHP)</p>
        <input
          type="number"
          min="1"
          step="any"
          value={rate}
          onChange={(e) => { setRate(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="e.g. 500"
          className="rate-input"
          autoFocus
        />
        {error && <p className="error-text">{error}</p>}
        <button className="btn-start" onClick={handleSubmit}>
          Begin
        </button>
      </div>

      <style jsx>{`
        .setup-screen {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }
        .setup-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          max-width: 320px;
          width: 100%;
          text-align: center;
        }
        .label-small {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0;
        }
        .rate-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--ink);
          padding: 0.5rem 0;
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 300;
          color: var(--ink);
          text-align: center;
          outline: none;
          -moz-appearance: textfield;
        }
        .rate-input::-webkit-outer-spin-button,
        .rate-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
        }
        .error-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: #a05040;
          margin: 0;
        }
        .btn-start {
          margin-top: 0.5rem;
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 0.75rem 2.5rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-start:hover { opacity: 0.75; }
      `}</style>
    </div>
  );
}

// ─── Main tracker screen ──────────────────────────────────────────────────────

export default function Page() {
  // session state — null means "not started / setup"
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // derived display values (updated every second)
  const [display, setDisplay] = useState({ seconds: 0, earnings: 0 });

  // motivation message
  const [motivation, setMotivation] = useState(null);
  const [motivationKey, setMotivationKey] = useState(0); // triggers re-animation
  const lastUsedRef = useRef({});

  // earnings animation key (increments each second to retrigger animation)
  const [earningsKey, setEarningsKey] = useState(0);

  // ── Load from localStorage on mount ──
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSession(saved);
    }
    setInitialized(true);
  }, []);

  // ── Tick: update display every second ──
  useEffect(() => {
    if (!session || session.paused) return;

    function tick() {
      const secs = elapsedSeconds(session);
      const earn = calculateEarnings(session);
      setDisplay({ seconds: secs, earnings: earn });
      setEarningsKey((k) => k + 1);
    }

    tick(); // immediate first tick
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  // ── Sync display when session changes (e.g. on resume from pause) ──
  useEffect(() => {
    if (!session) return;
    const secs = elapsedSeconds(session);
    const earn = calculateEarnings(session);
    setDisplay({ seconds: secs, earnings: earn });
  }, [session]);

  // ── Actions ──

  function handleStart(hourlyRate) {
    const s = {
      ...blankSession(hourlyRate),
      startTimestamp: Date.now(),
      paused: false,
    };
    saveSession(s);
    setSession(s);
  }

  function handlePause() {
    if (!session || session.paused) return;
    const accumulated = session.accumulatedMs + (Date.now() - session.startTimestamp);
    const s = { ...session, accumulatedMs: accumulated, startTimestamp: null, paused: true };
    saveSession(s);
    setSession(s);
  }

  function handleResume() {
    if (!session || !session.paused) return;
    const s = { ...session, startTimestamp: Date.now(), paused: false };
    saveSession(s);
    setSession(s);
  }

  function handleEnd() {
    clearSession();
    setSession(null);
    setMotivation(null);
    lastUsedRef.current = {};
  }

  function handleMotivate() {
    const { message, nextLastUsed } = assembleMotivation(
      lastUsedRef.current,
      formatTimeShort(display.seconds),
      formatEarnings(display.earnings),
    );
    lastUsedRef.current = nextLastUsed;
    setMotivation(message);
    setMotivationKey((k) => k + 1);
  }

  // ── Render ──

  if (!initialized) return null; // avoid hydration flash

  if (!session) {
    return (
      <>
        <AppHeader minimal />
        <SetupScreen onStart={handleStart} />
      </>
    );
  }

  const isPaused = session.paused;
  const timeStr = formatTime(display.seconds);
  const earningsStr = formatEarnings(display.earnings);

  return (
    <main className="tracker">
      <AppHeader />

      {/* ── Primary: Earnings ── */}
      <section className="earnings-section">
        <p className="earnings-label">earned so far</p>
        <p key={earningsKey} className="earnings-value earnings-animate">
          {earningsStr}
        </p>
      </section>

      {/* ── Secondary: Time ── */}
      <section className="time-section">
        <span className={`status-dot pulse-dot ${isPaused ? 'paused' : ''}`} />
        <p className="time-value">{timeStr}</p>
        <p className="time-label">{isPaused ? 'paused' : 'running'}</p>
      </section>

      {/* ── Motivation message ── */}
      {motivation && (
        <section className="motivation-section" key={motivationKey}>
          <p className="motivation-text motivation-in">{motivation}</p>
        </section>
      )}

      {/* ── Controls ── */}
      <section className="controls">
        <button className="btn-motivate" onClick={handleMotivate}>
          Motivate Me
        </button>

        <div className="secondary-controls">
          {isPaused ? (
            <button className="btn-ghost" onClick={handleResume}>Resume</button>
          ) : (
            <button className="btn-ghost" onClick={handlePause}>Pause</button>
          )}
          <span className="divider">·</span>
          <button className="btn-ghost btn-end" onClick={handleEnd}>End Session</button>
        </div>
      </section>

      <style jsx>{`
        .tracker {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 2.5rem;
        }

        /* Earnings */
        .earnings-section {
          text-align: center;
        }
        .earnings-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0 0 0.5rem;
        }
        .earnings-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(3.5rem, 10vw, 6rem);
          font-weight: 300;
          color: var(--ink);
          margin: 0;
          line-height: 1;
          letter-spacing: -0.01em;
        }

        /* Time */
        .time-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--gold);
          margin-bottom: 0.4rem;
        }
        .status-dot.paused {
          background: var(--muted);
          animation: none;
        }
        .time-value {
          font-family: 'DM Mono', monospace;
          font-size: 1.1rem;
          font-weight: 300;
          color: var(--ink);
          margin: 0;
          letter-spacing: 0.05em;
        }
        .time-label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin: 0;
        }

        /* Motivation */
        .motivation-section {
          max-width: 480px;
          text-align: center;
          padding: 0 1rem;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
          padding: 1.25rem 1.5rem;
        }
        .motivation-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
          line-height: 1.75;
          margin: 0;
        }

        /* Controls */
        .controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }
        .btn-motivate {
          background: var(--ink);
          color: var(--paper);
          border: none;
          padding: 0.85rem 2.75rem;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-motivate:hover { opacity: 0.75; }

        .secondary-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .btn-ghost {
          background: none;
          border: none;
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
        }
        .btn-ghost:hover { color: var(--ink); }
        .btn-end:hover { color: #a05040; }
        .divider {
          color: var(--line);
          font-size: 0.8rem;
        }
      `}</style>
    </main>
  );
}

// ─── Shared header ────────────────────────────────────────────────────────────

function AppHeader({ minimal = false }) {
  return (
    <header className={`app-header ${minimal ? 'minimal' : ''}`}>
      <p className="app-title">What the Hours Become</p>

      <style jsx>{`
        .app-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .app-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.85rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin: 0;
        }
      `}</style>
    </header>
  );
}
