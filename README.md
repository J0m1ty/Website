# jomity.net

<img width="1786" height="1244" alt="image" src="https://github.com/user-attachments/assets/d8c8a41c-fd59-4497-89a1-fa2ecfa276d7" />

Landing page for my website. Built with Vite, React, Tailwind and Pixi.js. View the separate status page at [status.jomity.net](https://status.jomity.net).

## Developing

```bash
pnpm install
pnpm dev        # http://localhost:5173, reloads on save
pnpm build      # static site in dist/
pnpm preview    # serve dist/ locally to check the production build
```

## Deploying

Pushing to `main` runs the "Docker image" action, which builds the site and
packs `dist/` into an nginx image at `ghcr.io/j0m1ty/landing-page` (see
`Dockerfile` and `nginx.conf`). The jombox server pulls and runs it (see
J0m1ty/Jombox).
