import { GameProvider } from './context/GameContext';
import { ErrorBoundary } from './components/ErrorBoundary';

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <GameProvider>
        <App />
      </GameProvider>
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById('root')
); 