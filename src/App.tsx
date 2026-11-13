import { BrowserRouter, Route, Routes } from 'react-router';
import Loading from './pages/Loading';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';

const Error = lazy(() => import('./pages/Error'));
const GridDemo = lazy(() => import('./pages/GridDemo'));

const App = () => {
    return (
        <Suspense fallback={<Loading />}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/grid" element={<GridDemo />} />
                    <Route path="*" element={<Error />} />
                </Routes>
            </BrowserRouter>
        </Suspense>
    )
}

export default App;