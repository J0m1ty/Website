import { lazy, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import favicon from './images/favicon.ico';
import App from './App';

const link = document.createElement('link');
link.rel = 'icon';
link.href = favicon;
document.head.appendChild(link);

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <App />
    </StrictMode>
)