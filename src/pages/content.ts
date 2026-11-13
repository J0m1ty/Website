// What the homepage says. Layout lives in GridDemo.tsx.
//
// House style: no colons, semicolons or em dashes in prose (labels and the
// "> " list markers are fine). Lists show their first few items and expand
// the rest.

export interface Role {
    title: string;
    text: string;
}

export interface Job {
    employer: string;
    /** One span for the employer, covering every role there. */
    when: string;
    roles: Role[];
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

export const JOBS: Job[] = [
    {
        employer: 'Lockheed Martin',
        when: 'May 2026 to Dec 2026',
        roles: [{
            title: 'Software Engineering Intern',
            text: 'At Missiles and Fire Control, proposed a standard architecture for telemetry tools and moved legacy C++ tools onto it in Python and React, rewriting HDLC serial protocols and checking them with hardware-in-the-loop tests. Built CI/CD pipelines that took test coverage from zero to 90% and cut runtime by over 60%.',
        }],
    },
    {
        employer: 'Insidyr Technologies',
        when: 'Jan 2025 to present',
        roles: [{
            title: 'Co-founder and lead developer',
            text: 'Building a zero-commission trading platform on Discord and the web, with Alpaca for brokerage and Stripe for payments. The backend runs on Cloudflare Workers, Queues and Durable Objects, with an Elixir/OTP service keeping per-user trade streams consistent.',
        }],
    },
    {
        employer: 'Rochester Institute of Technology',
        when: 'Aug 2025 to present',
        roles: [
            {
                title: 'Grader',
                text: 'Grading coursework for Intro to Computer Science Theory (CSCI 262).',
            },
            {
                title: 'Teaching Assistant',
                text: 'Helped teach and grade Intro to Software Engineering (SWEN 261) in class, and ran workshops on object-oriented programming, software design and working in teams.',
            },
        ],
    },
    {
        employer: 'Finger Lakes Community College',
        when: 'Jan 2023 to May 2024',
        roles: [{
            title: 'Peer Tutor',
            text: 'Tutored computer science and math one-on-one, in person and online, while still in high school through dual enrollment. Earned CRLA Level 1 tutor certification.',
        }],
    },
];

export const PERSONAL: Project[] = [
    {
        name: 'jombox',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://status.jomity.net', label: 'status' }],
        text: 'The Linux server behind this site, running since 2021. It hosts web services, APIs and game servers in Docker for a few thousand visitors a month, behind Cloudflare and NGINX.',
    },
    {
        name: 'market maker',
        langs: 'TypeScript',
        star: true,
        links: [{ href: 'https://market.jomity.net', label: 'try it' }, gh('marketmaker')],
        text: 'A real-time supply-and-demand simulator used for live classroom demos at RIT, with adjustable elasticity, price controls and market shocks. Rewriting its regression math made rendering about 50x faster.',
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
        text: 'A Discord bot for channel management.',
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
        text: 'A quality-of-life mod for the game Mindustry.',
    },
];

export const SCHOOL: Project[] = [
    {
        name: 'armadahex',
        langs: 'C#',
        star: true,
        links: [{ href: 'https://jomity.itch.io/armadahex', label: 'play' }, { href: 'https://armadahex.blogspot.com', label: 'dev blog' }],
        text: 'Battleship with hexagons, the New Media capstone at FLCC while I was dual enrolled. I led a team of 7 building it in Unity, with Photon networking, our own auth server, matchmaking and chat. Quadtree LODs cut load times by over 80% so it could run in the browser.',
    },
    {
        name: 'secure messenger',
        langs: 'C#',
        links: [gh('RIT-COPADS-02/secure-messaging-app')],
        text: 'Peer-to-peer chat for Parallel and Distributed Systems at RIT. I led a team of 3 pairing RSA key exchange with AES, and made the peer mesh fault-tolerant with UDP discovery, heartbeats and backoff reconnection.',
    },
    {
        name: 'relational records',
        langs: 'TypeScript, SQL',
        links: [gh('RIT-PDM-03-Group-52-Music/PDM-Project')],
        text: 'A music library app on Postgres for Principles of Data Management at RIT. We designed the schema, loaded the data, built the app on top, and finished with an analysis of what the data showed.',
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
        text: 'A vehicle-based tower defense game, made at Operation Catapult at Rose-Hulman.',
    },
];

/** Relevant RIT courses: code, then name. */
export const COURSES: [string, string][] = [
    ['CSCI 264', 'Honors Analysis of Algorithms'],
    ['CSCI 351', 'Data Communications and Networks'],
    ['CSCI 251', 'Parallel and Distributed Systems'],
    ['CSCI 462', 'Intro to Cryptography'],
    ['CSCI 331', 'Intro to Artificial Intelligence'],
    ['CSCI 344', 'Programming Language Concepts'],
    ['CSCI 320', 'Principles of Data Management'],
    ['CSCI 262', 'Intro to CS Theory'],
    ['SWEN 261', 'Intro to Software Engineering'],
    ['MATH 351', 'Graph Theory'],
    ['MATH 441', 'Abstract Algebra'],
    ['MATH 241', 'Honors Linear Algebra'],
];
