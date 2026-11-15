// What the homepage says. Layout lives in Home.tsx.
//
// House style: no colons, semicolons or em dashes in prose (labels and the
// "> " list markers are fine). Lists show their first few items and expand
// the rest.

export interface Job {
    title: string;
    employer: string;
    when: string;
    text: string;
}

export interface Link { href: string; label: string }

export interface Project {
    name: string;
    /** Languages, shown in parentheses after the name. */
    langs?: string;
    /** Starred as a highlight. */
    star?: boolean;
    links?: Link[];
    text: string;
}

const gh = (repo: string): Link => ({ href: `https://github.com/${repo.includes('/') ? repo : `J0m1ty/${repo}`}`, label: 'GitHub' });

/** The links card: one column per group when there's room, else one long list. */
export const LINKS: Link[][] = [
    [
        { href: 'https://github.com/J0m1ty', label: 'github' },
        { href: 'https://www.linkedin.com/in/jomity/', label: 'linkedin' },
        { href: '/resume.pdf', label: 'resume' },
        { href: 'mailto:jomity@hotmail.com', label: 'email' },
    ],
    [
        { href: 'https://discord.com/users/544963690185752576', label: 'discord' },
        { href: 'https://open.spotify.com/user/psbmkzrjh8ap9z2j0ioraesci', label: 'spotify' },
        { href: 'https://steamcommunity.com/profiles/76561199212641784', label: 'steam' },
        { href: 'https://www.chess.com/member/jomity', label: 'chess' },
    ],
    [
        { href: 'https://codeforces.com/profile/jomity', label: 'codeforces' },
        { href: 'https://leetcode.com/u/j0m1ty/', label: 'leetcode' },
    ],
];

// Newest start date first: the order once expanded.
export const JOBS: Job[] = [
    {
        title: 'Student Grader',
        employer: 'Rochester Institute of Technology',
        when: 'Aug 2026 to present',
        text: 'I grade coursework for Intro to Computer Science Theory (CSCI 262), always leaving detailed, constructive feedback and answering student emails quickly.',
    },
    {
        title: 'Software Engineering Intern',
        employer: 'Lockheed Martin',
        when: 'May 2026 to Dec 2026',
        text: 'I proposed a standard architecture for telemetry tools at Missiles and Fire Control, then moved legacy C++ tools onto it with Python and React, checked with hardware-in-the-loop tests. I also built CI/CD pipelines that took test coverage from zero to 90% and cut runtime by over 60%.',
    },
    {
        title: 'Teaching Assistant',
        employer: 'Rochester Institute of Technology',
        when: 'Aug 2025 to Dec 2025',
        text: 'I helped teach and grade Intro to Software Engineering (SWEN 261), and led cross-section workshops on object-oriented programming, software design, and the Angular framework.',
    },
    {
        title: 'Co-founder',
        employer: 'Insidyr Technologies',
        when: 'Jan 2025 to present',
        text: "We're building a zero-commission trading platform on Discord and the web, with Alpaca for brokerage and Stripe for payments. The backend runs on Cloudflare (Workers, Queues, and Hyperdrive), plus an Elixir/OTP service that handles live trade updates over WebSockets.",
    },
    {
        title: 'Peer Tutor',
        employer: 'Finger Lakes Community College',
        when: 'Jan 2023 to May 2024',
        text: 'I worked one-on-one with students in computer science and math, in person and online, helping them understand the material and grow into self-directed learners. I was still in high school through dual enrollment, and earned my CRLA Level 1 tutor certification along the way.',
    },
];

/** Collapsed, the experience card shows just these, in this order. */
export const JOBS_PREVIEW = ['Lockheed Martin', 'Insidyr Technologies']
    .map((employer) => JOBS.find((j) => j.employer === employer)!);

export const PERSONAL: Project[] = [
    {
        name: 'Jombox',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://status.jomity.net', label: 'Status' }],
        text: "I've spent countless hours on my Linux server, running since 2021. It hosts this site, web services, APIs and game servers for a few thousand visitors a month. These days it's a KVM VPS in Miami with 8 vCPUs, 16 GiB of RAM and 238 GiB of NVMe, and every app is its own Docker container, deployed straight from GitHub, behind Cloudflare and NGINX.",
    },
    {
        name: 'Market Maker',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://market.jomity.net', label: 'Try it' }, gh('marketmaker')],
        text: 'A real-time supply and demand simulator I made for live classroom demos at RIT, with adjustable elasticity, price controls and market shocks. Speeding up the regression algorithms by 50x made it smooth enough to run on phones.',
    },
    {
        name: 'Threadblend',
        langs: 'TypeScript',
        links: [gh('threadblend')],
        text: 'A Discord bot for channel management, made for my friends.',
    },
    {
        name: 'SurvivStats',
        langs: 'JavaScript',
        links: [gh('SurvivStats')],
        text: 'A small passion project that gave an easy, streamlined way to look up game info and player statistics for surviv.io, right in Discord. At its peak it was on over 15 servers. Built with Discord.js, and Puppeteer for web scraping.',
    },
    {
        name: 'Mindustrity',
        langs: 'Java',
        links: [gh('Mindustrity')],
        text: 'A quality-of-life mod for the game hit indie game Mindustry.',
    },
    {
        name: 'ts-safe-union',
        langs: 'TypeScript',
        links: [{ href: 'https://www.npmjs.com/package/ts-safe-union', label: 'npm' }],
        text: 'A small TypeScript utility for safely destructuring discriminated unions.',
    },
];

export const SCHOOL: Project[] = [
    {
        name: 'Armadahex',
        langs: 'C#',
        star: true,
        links: [{ href: 'https://jomity.itch.io/armadahex', label: 'Play' }, { href: 'https://armadahex.blogspot.com', label: 'Dev blog' }],
        text: 'An online multiplayer spinoff of Battleship, with Advanced Mission rules and hexagonal tiles. It was our New Media capstone at FLCC while I was dual enrolled, and I led the team of 7 building it in Unity, with Photon networking, our own auth server, matchmaking and chat. Quadtree LODs cut load times by over 80%, so it runs right in the browser.',
    },
    {
        name: 'Secure Messenger',
        langs: 'C#',
        links: [gh('RIT-COPADS-02/secure-messaging-app')],
        text: 'An encrypted peer-to-peer messaging app for Parallel and Distributed Systems at RIT. I led our team of 3 and handled the RSA key exchange, AES message encryption and SHA-256 signatures. The peer mesh stays up through failures, with UDP discovery, heartbeats and backoff reconnects.',
    },
    {
        name: 'Relational Records',
        langs: 'TypeScript, SQL',
        links: [gh('RIT-PDM-03-Group-52-Music/PDM-Project')],
        text: 'A music library app on Postgres for Principles of Data Management at RIT, with collections, ratings, follows and genre-based recommendations. Instead of menus you just chat with it, and an LLM plans calls against our type-checked SQL API.',
    },
    {
        name: 'Pong AI',
        langs: 'C#',
        links: [{ href: 'https://j0m1ty.github.io/PongAI/', label: 'Play' }, gh('PongAI')],
        text: 'My second go at reinforcement learning. It played against itself for a few hours and is now about as good as an average person. Made in Unity with the ML-Agents toolkit, and it runs in the browser. See if you can beat it!',
    },
    {
        name: 'Tank Tower Defense',
        langs: 'Python',
        links: [gh('TankTowerDefense')],
        text: 'A vehicle-based tower defense game, made in one week at Operation Catapult at Rose-Hulman.',
    },
];

export interface Term {
    term: string;
    courses: [string, string, boolean, number | null, number, boolean][];    // code, name, honors, grade (percent, null while in progress), credits, important
}

/** CS and math courses at RIT by semester, newest first (gen eds left out). */
export const COURSES: Term[] = [
    {
        term: 'Fall 2026',
        courses: [
            ['CSCI 264', 'Analysis of Algorithms', true, 100, 3, true],
            ['CSCI 351', 'Data Communications and Networks', false, 96.69, 3, false],
            ['MATH 351', 'Graph Theory', false, 94.59, 3, false],
            ['MATH 441', 'Abstract Algebra I', false, 93.69, 3, false],
        ],
    },
    {
        term: 'Spring 2026',
        courses: [
            ['CSCI 251', 'Parallel and Distributed Systems', false, 97.49, 3, true],
            ['CSCI 331', 'Intro to Artificial Intelligence', false, 99.54, 3, false],
            ['CSCI 462', 'Intro to Cryptography', false, 98.09, 3, true],
            ['MATH 241', 'Linear Algebra', true, 93.37, 3, false],
            ['MATH 231', 'Differential Equations', false, 90.89, 3, false],
        ],
    },
    {
        term: 'Fall 2025',
        courses: [
            ['CSCI 262', 'Intro to CS Theory', false, 99.84, 3, true],
            ['CSCI 320', 'Principles of Data Management', false, 95.63, 3, true],
            ['CSCI 344', 'Programming Language Concepts', false, 90.68, 3, false],
            ['MATH 221', 'Multivariable Calculus', true, 98.45, 4, false],
        ],
    },
    {
        term: 'Spring 2025',
        courses: [
            ['CSCI 243', 'Mechanics of Programming', false, 95.92, 3, true],
            ['SWEN 261', 'Intro to Software Engineering', false, 98.48, 3, true],
            ['MATH 190', 'Discrete Math for Computing', false, 93.83, 3, false],
            ['MATH 251', 'Probability and Statistics', false, 95.43, 3, false],
        ],
    },
    {
        term: 'Fall 2024',
        courses: [
            ['CSCI 140', 'Computer Science for AP Students', false, 95.91, 4, true],
            ['MATH 182', 'Calculus II', false, 98.66, 4, false],
        ],
    },
];
