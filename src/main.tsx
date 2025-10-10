import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { validateEnv } from './lib/env';
import { setupGlobalErrorHandlers } from './lib/errorHandler';
import './lib/test-database'; // Import to run database tests

// Validate environment variables on app startup
validateEnv();

// Set up global error handlers for unhandled errors
setupGlobalErrorHandlers();

createRoot(document.getElementById('root')!).render(<App />);
