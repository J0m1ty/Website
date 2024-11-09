import { Provider } from './components/ui/provider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Main from './Main';
import './index.css';

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <Provider>
            <Main />
        </Provider>
    </StrictMode>
)