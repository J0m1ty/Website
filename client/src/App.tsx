import { Provider } from './components/ui/provider';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Loading from './pages/Loading';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const StatusPage = lazy(() => import('./pages/StatusPage'));
const Error = lazy(() => import('./pages/Error'));

const App = () => {
    const hostname = window.location.hostname;

    return (
        <Provider>
            <Suspense fallback={<Loading />}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {hostname === "status.jomity.net" ? (
                            <>
                                <Route path="/" element={<StatusPage />} />
                                <Route path="*" element={<Error />} />
                            </>
                        ) : (
                            <>
                                <Route path="/" element={<Home />} />
                                <Route path="/status" element={<StatusPage />} />
                                <Route path="*" element={<Error />} />
                            </>
                        )}
                    </Routes>
                </BrowserRouter>
            </Suspense>
        </Provider>
    )
}

export default App;