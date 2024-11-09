import { Provider } from './components/ui/provider';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Main from './Main';
import './index.css';
import Overlay from './Overlay';

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <Provider>
            <Main />
            <Overlay />
        </Provider>
    </StrictMode>
)