const buttonClass =
    "rounded-md bg-lime-400 px-5 py-2 text-base font-semibold text-black transition-opacity hover:opacity-70";

export default function Overlay() {
    return (
        <div
            className="fixed left-0 top-0 flex h-full w-full flex-col justify-center overflow-hidden text-center text-white"
            id="noSelect"
        >
            <div className="flex flex-col items-center gap-5">
                <div className="flex h-50 w-full items-center justify-center bg-black/50 lg:h-64">
                    <p className="text-[75px] text-white md:text-[100px] lg:text-[120px]">
                        jomity.net
                    </p>
                </div>
                <div className="flex flex-row flex-wrap items-center justify-center gap-5 px-4">
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open("https://github.com/J0m1ty", "_blank");
                        }}
                    >
                        GitHub
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open("https://www.linkedin.com/in/jomity/", "_blank");
                        }}
                    >
                        LinkedIn
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(
                                "https://open.spotify.com/user/psbmkzrjh8ap9z2j0ioraesci?si=ffd394c84a164056",
                                "_blank"
                            );
                        }}
                    >
                        Spotify
                    </button>
                    <button
                        className={buttonClass}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(
                                "https://discord.com/users/544963690185752576",
                                "_blank"
                            );
                        }}
                    >
                        Discord
                    </button>
                </div>
            </div>
        </div>
    )
};