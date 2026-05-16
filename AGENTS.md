# Alpha Canvas Overlay Studio — agent context

Local single-page app for designing **mobile overlay graphics** and exporting **WebM video with alpha** for compositing over footage. No backend.

## Run / build

```bash
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

**Use Chrome or Chromium** for recording. Alpha WebM from `canvas.captureStream` + `MediaRecorder` is unreliable in Safari/Firefox. The UI warns when VP9/WebM is unavailable.

**Node**: Vite 8 (`^8.0.13`). Requires Node `^20.19.0` or `>=22.12.0`.

## Architecture

One browser window: **admin panel (left)** edits scenes; **stage (right)** shows scaled preview + export controls. Only the export `<canvas>` is recorded — admin UI is never captured.

```
Admin → scene state (localStorage) → canvas renderer → templates
Export canvas → captureStream → MediaRecorder → WebM blob → download / alpha-check video
```

| Path | Role |
|------|------|
| `index.html` | Shell: admin, `#export-canvas` (390×844), record controls, playback video |
| `src/main.js` | Boot, wire admin ↔ state ↔ renderer ↔ recorder |
| `src/state/scenes.js` | Scene CRUD, persistence |
| `src/admin/ui.js` | Scene list, schema-driven form (debounced ~50ms) |
| `src/templates/registry.js` | Template registry, field schema, `CANVAS_WIDTH` / `CANVAS_HEIGHT` |
| `src/templates/twoBoxText.js` | Template 1: two rounded boxes, headline + wrapped body |
| `src/canvas/renderer.js` | `clearRect` + dispatch to template `draw` |
| `src/canvas/theme.js` | Read CSS vars via hidden `#theme-probe` — **no hardcoded colors in canvas** |
| `src/styles/theme.css` | **Single source of truth** for colors/fonts (CSS variables) |
| `src/styles/layout.css` | Split layout, checkerboard preview, CSS scale on canvas |
| `src/recorder/export.js` | MediaRecorder lifecycle, draw loop during record, download |

## Hard constraints

- **Canvas size**: 390×844 (9:16 logical phone). Defined in `registry.js`; preview scaled with CSS only.
- **Transparency**: Every frame starts with `ctx.clearRect(0, 0, w, h)`. Templates must not fill a full opaque background unless intentional.
- **Theme**: Canvas reads `--color-*`, `--font-*` from computed styles on `#theme-probe`. Edit `theme.css`, not hex in template draw code.
- **Recording**: Chrome needs the canvas **redrawn every frame** during capture (`requestAnimationFrame` or interval at chosen FPS). VP9 preferred: `video/webm;codecs=vp9`, then vp8, then `video/webm`.
- **Stack**: Vite + **vanilla JS modules only** — no React, no build-time framework.

## Scene model

```js
{
  id: "uuid",
  templateId: "twoBoxText",
  label: "Scene 1",
  data: {
    box1: { headline: "...", text: "..." },
    box2: { headline: "...", text: "..." }
  }
}
```

**localStorage keys**: `overlay-canvas-studio-scenes`, `overlay-canvas-studio-active`.

Default scenes seeded on first load. Delete confirms when more than one scene remains.

## Adding a template

1. Add `src/templates/myTemplate.js` with `draw(ctx, data, w, h, theme)` and defaults.
2. Register in `src/templates/registry.js`: `fields` array (dotted keys like `box1.headline`), `defaults`, `draw`.
3. Admin form is generated from `fields` — no hand-written form per template.

## Recording UX

- FPS: 30 (default) or 60
- Mode: current scene or all scenes (sequential)
- Duration per scene (seconds)
- Download last `.webm`; playback over bright checkerboard for alpha verification

**Alpha fallback** (not automated): chroma-key + ffmpeg — see comment at top of `src/recorder/export.js`.

## Out of scope (unless asked)

- Backend, auth, cloud storage
- Safari/Firefox-first recording workflows
- Automated ffmpeg post-processing
- Scene drag-and-drop reorder (state is ordered arrays; UI not built yet)

## Conventions when changing code

- Match existing module layout and naming.
- Keep theme in CSS variables; extend semantic tokens in `theme.css` if templates need new colors.
- Small, focused diffs — no drive-by refactors.
- Test in Chrome: `npm run dev`, record a short clip, confirm alpha on checkerboard playback.
