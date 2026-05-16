# Alpha Canvas Overlay Studio

Design mobile overlay graphics (390×844) in the browser and export **WebM video with transparency** for compositing over your footage. Scenes are saved in the browser via `localStorage`.

## Prerequisites

- **Node.js** `^20.19.0` or `>=22.12.0` (required by Vite 8)
- **Chrome or Chromium** for recording — alpha WebM export works best there; Safari and Firefox are not recommended for this workflow

## Setup

```bash
git clone <repository-url>
cd overlay-canvas-studio
npm install
```

## Run

**Development** (hot reload):

```bash
npm run dev
```

Open the URL Vite prints (usually **http://localhost:5173/**) in Chrome.

**Production build**:

```bash
npm run build
npm run preview
```

`preview` serves the built app locally so you can test the production bundle.

## Using the app

1. Edit scenes in the left panel (add, delete, switch between scenes).
2. Preview the overlay on the right (checkerboard = transparent areas).
3. Choose FPS, duration, and whether to record the current scene or all scenes.
4. Click **Record**, then **Stop**, then **Download WebM**.
5. Use the **Alpha check** playback to confirm transparency over the colored background.

Theme colors and fonts live in `src/styles/theme.css`.

## Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm run dev`     | Start dev server               |
| `npm run build`   | Build to `dist/`               |
| `npm run preview` | Preview production build       |

## Project docs

See [AGENTS.md](./AGENTS.md) for architecture, conventions, and notes for contributors.
