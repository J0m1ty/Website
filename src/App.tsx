import { BrowserRouter, Route, Routes } from 'react-router';
import { lazy, Suspense } from 'react';
import Loading from './pages/Loading';
import Home from './pages/Home';

const NotFound = lazy(() => import('./pages/NotFound'));

const App = () => {
    return (
        <Suspense fallback={<Loading />}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </Suspense>
    );
};

export default App;
