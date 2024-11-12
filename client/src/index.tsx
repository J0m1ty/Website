import { Provider } from './components/ui/provider';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Loading from './pages/Loading';

const Home = lazy(() => import('./pages/Home'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const Error = lazy(() => import('./pages/Error'));

createRoot(document.querySelector('#entry')!).render(
    <StrictMode>
        <Provider>
            <Suspense fallback={<Loading />}>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/status" element={<StatusPage />} />
                        <Route path="*" element={<Error />} />
                    </Routes>
                </BrowserRouter>
            </Suspense>
        </Provider>
    </StrictMode>
)