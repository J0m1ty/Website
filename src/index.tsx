import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Self-hosted JetBrains Mono (same subsets as Google Fonts), bundled into /assets.
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import './index.css';
import App from './App';

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)
