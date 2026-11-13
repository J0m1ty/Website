// What the homepage says. Layout lives in GridDemo.tsx.
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

const gh = (repo: string): Link => ({ href: `https://github.com/${repo.includes('/') ? repo : `J0m1ty/${repo}`}`, label: 'github' });

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
        { href: 'https://www.reddit.com/user/J0mity/', label: 'reddit' },
        { href: 'https://x.com/jomity404', label: 'x' },
    ],
    [
        { href: 'https://steamcommunity.com/profiles/76561199212641784', label: 'steam' },
        { href: 'https://www.chess.com/member/jomity', label: 'chess' },
    ],
];

// Newest start date first: the order once expanded.
export const JOBS: Job[] = [
    {
        title: 'Student Grader',
        employer: 'Rochester Institute of Technology',
        when: 'Aug 2026 to present',
        text: 'Evaluating coursework for Intro to Computer Science Theory (CSCI 262) against standardized rubrics. I leave detailed, constructive feedback and answer student emails quickly.',
    },
    {
        title: 'Software Engineering Intern',
        employer: 'Lockheed Martin',
        when: 'May 2026 to Dec 2026',
        text: 'Proposed a standard architecture for telemetry tools at Missiles and Fire Control and moved legacy C++ tools onto it using Python and React, checking them with hardware-in-the-loop tests. I built CI/CD pipelines that took test coverage from zero to 90% and cut runtime by over 60%.',
    },
    {
        title: 'Teaching Assistant',
        employer: 'Rochester Institute of Technology',
        when: 'Aug 2025 to Dec 2025',
        text: 'Helped support instruction and grade for Intro to Software Engineering (SWEN 261). I led multiple cross-section workshops on object-oriented programming, software design, and the Angular framework.',
    },
    {
        title: 'Co-founder',
        employer: 'Insidyr Technologies',
        when: 'Jan 2025 to present',
        text: 'Building a zero-commission trading platform on Discord and the web, with Alpaca for brokerage services and Stripe for payments. The backend runs on Cloudflare (Workers, Queues, and Hyperdrive) and an Elixir/OTP service for handling WebSocket trade updates.',
    },
    {
        title: 'Peer Tutor',
        employer: 'Finger Lakes Community College',
        when: 'Jan 2023 to May 2024',
        text: 'Tutored computer science and math one-on-one, in person and online, while still in high school through dual enrollment. Earned CRLA Level 1 tutor certification.',
    },
];

/** Collapsed, the experience card shows just these, in this order. */
export const JOBS_PREVIEW = ['Lockheed Martin', 'Insidyr Technologies']
    .map((employer) => JOBS.find((j) => j.employer === employer)!);

export const PERSONAL: Project[] = [
    {
        name: 'jombox',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://status.jomity.net', label: 'status' }],
        text: 'The Linux server behind this site, running since 2021. It hosts Dockerized web services, APIs and game servers for a few thousand visitors a month, behind Cloudflare and NGINX.',
    },
    {
        name: 'market maker',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://market.jomity.net', label: 'try it' }, gh('marketmaker')],
        text: 'A real-time supply-and-demand simulator used for live classroom demos at RIT, with adjustable elasticity, price controls and market shocks. Speeding up regression algorithms by 50x enabled real-time rendering on mobile devices.',
    },
    {
        name: 'r6 geoguessr',
        langs: 'TypeScript',
        text: 'A multiplayer geolocation game on 3D panoramas from Rainbow Six Siege, built for private lobbies, pro team training and stream games played straight from Twitch.',
    },
    {
        name: 'threadblend',
        langs: 'TypeScript',
        links: [gh('threadblend')],
        text: 'A Discord bot for channel management, made for my friends.',
    },
    {
        name: 'ts-safe-union',
        langs: 'TypeScript',
        links: [{ href: 'https://www.npmjs.com/package/ts-safe-union', label: 'npm' }],
        text: 'A small TypeScript utility for safely destructuring discriminated unions.',
    },
    {
        name: 'mindustrity',
        langs: 'Java',
        links: [gh('Mindustrity')],
        text: 'A quality-of-life mod for Mindustry.',
    },
];

export const SCHOOL: Project[] = [
    {
        name: 'armadahex',
        langs: 'C#',
        star: true,
        links: [{ href: 'https://jomity.itch.io/armadahex', label: 'play' }, { href: 'https://armadahex.blogspot.com', label: 'dev blog' }],
        text: 'Battleship with hexagons, the New Media capstone at FLCC while I was dual enrolled. I led a team of 7 building it in Unity, with Photon networking, our own auth server, matchmaking and chat. Implementing Quadtree LODs cut load times by over 80% so it could run in the browser.',
    },
    {
        name: 'secure messenger',
        langs: 'C#',
        links: [gh('RIT-COPADS-02/secure-messaging-app')],
        text: 'An encrypted peer-to-peer messaging app for Parallel and Distributed Systems at RIT. I led a team of 3 and was responsible for RSA key exchange, AES message encryption, and SHA-256 signature verification. We made the peer mesh fault-tolerant with UDP discovery, heartbeats and backoff reconnection.',
    },
    {
        name: 'relational records',
        langs: 'TypeScript, SQL',
        links: [gh('RIT-PDM-03-Group-52-Music/PDM-Project')],
        text: 'A music library app on Postgres for Principles of Data Management at RIT, with collections, ratings, follows and genre-based recommendations. Instead of menus you just chat with it, and an LLM plans calls against our type-checked SQL API.',
    },
    {
        name: 'pong ai',
        langs: 'C#',
        links: [{ href: 'https://j0m1ty.github.io/PongAI/', label: 'play' }, gh('PongAI')],
        text: 'A reinforcement learning example in Unity that teaches itself Pong, playable in the browser.',
    },
    {
        name: 'tank tower defense',
        langs: 'Python',
        links: [gh('TankTowerDefense')],
        text: 'A vehicle-based tower defense game, made during one week at Operation Catapult at Rose-Hulman.',
    },
];

export interface Term {
    term: string;
    courses: [string, string][];    // code, name
}

/** Shown above the semesters. */
export const GPA = '3.98 GPA, 126 credits';

/** CS and math courses at RIT by semester, newest first (gen eds left out). */
export const COURSES: Term[] = [
    {
        term: 'Fall 2026',
        courses: [
            ['CSCI 264', 'Honors Analysis of Algorithms'],
            ['CSCI 351', 'Data Communications and Networks'],
            ['MATH 351', 'Graph Theory'],
            ['MATH 441', 'Abstract Algebra'],
        ],
    },
    {
        term: 'Spring 2026',
        courses: [
            ['CSCI 251', 'Parallel and Distributed Systems'],
            ['CSCI 331', 'Intro to Artificial Intelligence'],
            ['CSCI 462', 'Intro to Cryptography'],
            ['MATH 241', 'Honors Linear Algebra'],
            ['MATH 231', 'Differential Equations'],
        ],
    },
    {
        term: 'Fall 2025',
        courses: [
            ['CSCI 262', 'Intro to CS Theory'],
            ['CSCI 320', 'Principles of Data Management'],
            ['CSCI 344', 'Programming Language Concepts'],
            ['MATH 221', 'Honors Multivariable Calculus'],
        ],
    },
    {
        term: 'Spring 2025',
        courses: [
            ['CSCI 243', 'Mechanics of Programming'],
            ['SWEN 261', 'Intro to Software Engineering'],
            ['MATH 190', 'Discrete Math for Computing'],
            ['MATH 251', 'Probability and Statistics'],
        ],
    },
    {
        term: 'Fall 2024',
        courses: [
            ['CSCI 140', 'Computer Science for AP Students'],
            ['MATH 182', 'Calculus II'],
        ],
    },
];
