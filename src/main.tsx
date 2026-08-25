// ============================================================
// SIGNAL ARENA — MAIN ENTRY POINT
// ============================================================
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// ── Global styles ──
import './index.css';

// ── Mount app ──
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// ── Performance monitoring ──
if (import.meta.env.DEV) {
  console.log(`
╔═══════════════════════════════════════════════╗
║  ⚔️  SIGNAL ARENA v2.0.0                     ║
║  Proof of Skill                               ║
║                                               ║
║  "A crypto game that makes you smarter,       ║
║   not poorer."                                ║
║                                               ║
║  "Play the market. Don't become the           ║
║   liquidity."                                 ║
╚═══════════════════════════════════════════════╝
  `);
}
