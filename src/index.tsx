import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted Roboto Mono (same subsets as Google Fonts), bundled into /assets.
import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import './index.css';
import App from './App';

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
