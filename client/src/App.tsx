import { Provider } from './components/ui/provider';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Loading from './pages/Loading';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Error = lazy(() => import('./pages/Error'));

const App = () => {
    return (
        <Provider>
            <Suspense fallback={<Loading />}>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="*" element={<Error />} />
                    </Routes>
                </BrowserRouter>
            </Suspense>
        </Provider>
    )
}

export default App;