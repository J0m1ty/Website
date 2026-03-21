import { useLocation, useNavigate } from "react-router-dom";

const Error = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = () => {
        if (window.history.length > 2) {
            window.history.back();
        } else {
            navigate("/");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-5">
            <section className="w-full max-w-xl rounded-lg border border-zinc-300 bg-white/90 p-6 text-zinc-900 shadow-xl">
                <h1 className="border-b border-zinc-300 pb-4 text-center text-2xl font-bold">404 Page Not Found</h1>
                <div className="pt-4 text-base">
                    <p>
                        The requested page at{' '}
                        <code className="rounded bg-zinc-200 px-1 py-0.5">
                            {location.pathname.length < 20 ? location.pathname : location.pathname.substring(0, 17) + "..."}
                        </code>{' '}
                        does not exist.
                    </p>
                    <button
                        className="mt-4 text-green-700 underline underline-offset-2"
                        onClick={goBack}
                        type="button"
                    >
                        Go back to the previous page.
                    </button>
                </div>
            </section>
        </div>
    );
}

export default Error;