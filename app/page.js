'use client';

import { useState, useEffect, useRef } from 'react';
import {
  blankSession,
  elapsedSeconds,
  formatTime,
  formatTimeShort,
  loadSession,
  saveSession,
  clearSession,
} from '../lib/timer';
import { assembleMotivation } from '../lib/motivation';
import { CURRENCIES, RATE_PERIODS, computeEarnings, formatAmount } from '../lib/rates';

// ─── Setup screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onStart }) {
  const [rate, setRate] = useState('');
  const [currency, setCurrency] = useState('PHP');
  const [period, setPeriod] = useState('hourly');
  const [error, setError] = useState('');
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedCurrency = CURRENCIES.find((c) => c.code === currency);
  const selectedPeriod = RATE_PERIODS.find((p) => p.id === period);

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCurrencyOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleStart() {
    const parsed = parseFloat(rate);
    if (!parsed || parsed <= 0) {
      setError('Enter a valid rate.');
      return;
    }
    onStart(parsed, currency, period, selectedPeriod.secondsPerPeriod);
  }

  return (
    <div className="setup-screen">
      <div className="setup-inner">
        <p className="app-wordmark">What the Hours Become</p>

        <div className="rate-row">
          <div className="currency-selector" ref={dropdownRef}>
            <button
              className="currency-trigger"
              onClick={() => setCurrencyOpen((o) => !o)}
              type="button"
            >
              <span className="currency-symbol">{selectedCurrency.symbol}</span>
              <span className="currency-code">{selectedCurrency.code}</span>
              <span className="chevron">{currencyOpen ? '▲' : '▼'}</span>
            </button>

            {currencyOpen && (
              <div className="currency-dropdown">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    className={'currency-option' + (c.code === currency ? ' active' : '')}
                    onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                    type="button"
                  >
                    <span className="opt-symbol">{c.symbol}</span>
                    <span className="opt-code">{c.code}</span>
                    <span className="opt-name">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="number"
            min="1"
            step="any"
            value={rate}
            onChange={(e) => { setRate(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            placeholder="0"
            className="rate-input"
            autoFocus
          />
        </div>

        <div className="period-row">
          {RATE_PERIODS.map((p) => (
            <button
              key={p.id}
              className={'period-btn' + (p.id === period ? ' active' : '')}
              onClick={() => setPeriod(p.id)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn-start" onClick={handleStart}>
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
          gap: 1.5rem;
          max-width: 380px;
          width: 100%;
          text-align: center;
        }
        .app-wordmark {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          color: var(--muted);
          margin: 0 0 0.5rem;
        }
        .rate-row {
          display: flex;
          align-items: center;
          width: 100%;
          border-bottom: 1px solid var(--ink);
        }
        .rate-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.5rem 0.25rem;
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.5rem;
          font-weight: 300;
          color: var(--ink);
          text-align: right;
          outline: none;
          -moz-appearance: textfield;
          min-width: 0;
        }
        .rate-input::-webkit-outer-spin-button,
        .rate-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .currency-selector { position: relative; flex-shrink: 0; }
        .currency-trigger {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.5rem 0.5rem 0;
          font-family: 'DM Mono', monospace;
          color: var(--ink);
          outline: none;
        }
        .currency-symbol {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 300;
          line-height: 1;
        }
        .currency-code {
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--muted);
        }
        .chevron { font-size: 0.45rem; color: var(--muted); margin-top: 1px; }
        .currency-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          background: var(--paper);
          border: 1px solid var(--line);
          z-index: 100;
          width: 240px;
          max-height: 280px;
          overflow-y: auto;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        .currency-option {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem 0.75rem;
          text-align: left;
          transition: background 0.12s;
        }
        .currency-option:hover { background: rgba(0,0,0,0.04); }
        .currency-option.active { background: rgba(0,0,0,0.06); }
        .opt-symbol {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          width: 1.5rem;
          text-align: center;
          color: var(--ink);
        }
        .opt-code {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          color: var(--ink);
          width: 2.5rem;
        }
        .opt-name {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          color: var(--muted);
        }
        .period-row {
          display: flex;
          width: 100%;
          border: 1px solid var(--line);
        }
        .period-btn {
          flex: 1;
          background: none;
          border: none;
          border-right: 1px solid var(--line);
          padding: 0.55rem 0;
          font-family: 'DM Mono', monospace;
          font-size: 0.62rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .period-btn:last-child { border-right: none; }
        .period-btn.active { background: var(--ink); color: var(--paper); }
        .error-text {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          color: #a05040;
          margin: 0;
        }
        .btn-start {
          margin-top: 0.25rem;
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

// ─── Main tracker screen ───────────────────────────────────────────────────────

export default function Page() {
  const [session, setSession] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [display, setDisplay] = useState({ seconds: 0, earnings: 0 });
  const [motivation, setMotivation] = useState(null);
  const [motivationKey, setMotivationKey] = useState(0);
  const [earningsKey, setEarningsKey] = useState(0);
  const lastUsedRef = useRef({});

  useEffect(() => {
    const saved = loadSession();
    if (saved) setSession(saved);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!session || session.paused) return;
    function tick() {
      const secs = elapsedSeconds(session);
      const earn = computeEarnings(session.rate, session.ratePeriod, secs);
      setDisplay({ seconds: secs, earnings: earn });
      setEarningsKey((k) => k + 1);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (!session) return;
    const secs = elapsedSeconds(session);
    const earn = computeEarnings(session.rate, session.ratePeriod, secs);
    setDisplay({ seconds: secs, earnings: earn });
  }, [session]);

  function handleStart(rate, currencyCode, ratePeriod, periodSeconds) {
    const s = {
      ...blankSession(rate, currencyCode, ratePeriod, periodSeconds),
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
    const timeStr = formatTimeShort(display.seconds);
    const earningStr = formatAmount(display.earnings, session.currencyCode);
    const { message, nextLastUsed } = assembleMotivation(lastUsedRef.current, timeStr, earningStr);
    lastUsedRef.current = nextLastUsed;
    setMotivation(message);
    setMotivationKey((k) => k + 1);
  }

  if (!initialized) return null;

  if (!session) return <SetupScreen onStart={handleStart} />;

  const isPaused = session.paused;
  const timeStr = formatTime(display.seconds);
  const earningsStr = formatAmount(display.earnings, session.currencyCode);
  const periodLabel = RATE_PERIODS.find((p) => p.id === session.ratePeriod)?.label ?? 'Hourly';

  return (
    <main className="tracker">
      <header className="app-header">
        <p className="app-title">What the Hours Become</p>
      </header>

      <section className="earnings-section">
        <p className="earnings-label">earned so far</p>
        <p key={earningsKey} className="earnings-value earnings-animate">
          {earningsStr}
        </p>
        <p className="rate-context">
          {formatAmount(session.rate, session.currencyCode)} / {periodLabel.toLowerCase()}
        </p>
      </section>

      <section className="time-section">
        <span className={'status-dot pulse-dot' + (isPaused ? ' paused' : '')} />
        <p className="time-value">{timeStr}</p>
        <p className="time-label">{isPaused ? 'paused' : 'running'}</p>
      </section>

      {motivation && (
        <section className="motivation-section" key={motivationKey}>
          <p className="motivation-text motivation-in">{motivation}</p>
        </section>
      )}

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
          padding: 5rem 2rem 3rem;
          gap: 2.5rem;
        }
        .app-header {
          position: fixed;
          top: 0; left: 0; right: 0;
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
        .earnings-section { text-align: center; }
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
        .rate-context {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin: 0.5rem 0 0;
        }
        .time-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--gold);
          margin-bottom: 0.4rem;
        }
        .status-dot.paused { background: var(--muted); animation: none; }
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
        .motivation-section {
          max-width: 480px;
          text-align: center;
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
        .divider { color: var(--line); font-size: 0.8rem; }
      `}</style>
    </main>
  );
}
