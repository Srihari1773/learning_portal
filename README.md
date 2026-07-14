# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Learning Portal (Assignment)

This repository includes a simple Learning Portal demo with a video player that supports multiple bookmarks per video and a best-effort screenshot-deterrent.

Quick start:

```bash
npm install
npm run dev
```

To start the backend API (optional) run:

```bash
npm install
npm run server
```

Or during development (auto-restart) if you install `nodemon`:

```bash
npm install --save-dev nodemon
npm run server:dev
```

Screenshot protection approach:
- Web browsers cannot reliably prevent screenshots; this project implements best-effort deterrents:
	- Listen for the `PrintScreen` key and briefly overlay/blur the video.
	- Listen for `paste` events that include image data and warn/obscure the player.
	- Disable right-click context menu inside the page to discourage simple captures.
	- These are deterrents only — documentational proof is included in the assignment submission.

Bookmarks:
- Add a bookmark at the current timestamp with an optional title.
- Bookmarks persist in `localStorage` per video using the key `bookmarks:<videoId>`.
- Click a bookmark to seek the video to the saved timestamp.

Notes:
- For full protection (e.g., preventing OS-level screenshots) you need platform-specific solutions (native apps or DRM-enabled players). The web demo demonstrates UI and persistence behaviors required for the assignment.

