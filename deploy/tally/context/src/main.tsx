import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LandingPage } from './pages/LandingPage';
import { GamePickerPage } from './pages/GamePickerPage';
import { PlayerSetupPage } from './pages/PlayerSetupPage';
import { ScoringPage } from './pages/ScoringPage';
import { HistoryPage } from './pages/HistoryPage';
import './styles/global.css';
import './styles/scoring.css';
import './styles/keypad.css';
import './styles/generic.css';
import './styles/license-plate.css';
import './styles/tic-tac-toe.css';

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pick-game" element={<GamePickerPage />} />
            <Route path="/setup/:gameId" element={<PlayerSetupPage />} />
            <Route path="/game" element={<ScoringPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
