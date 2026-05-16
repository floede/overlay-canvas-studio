# Copilot Instructions — Overlay Canvas Studio

Single-page Vite app for designing **390×844 mobile overlays** and exporting **WebM video with alpha transparency** for compositing. Vanilla JS modules only — no React/Vue/frameworks.

## Critical Architecture Patterns

### Unidirectional Data Flow
```
Admin UI → state mutation → localStorage → notify(onChange) → canvas re-render
```
- **Never** directly manipulate DOM in state modules
- All state mutations go through `src/state/scenes.js` functions that save to localStorage
- Admin UI (`src/admin/ui.js`) debounces onChange by ~50ms to batch canvas redraws
- Canvas (`src/canvas/renderer.js`) is **purely reactive** — pull from state, never push

### Template System
Each template in `src/templates/` exports:
- `draw(ctx, data, width, height, theme)` — pure function, no side effects
- `defaultXxxData()` — factory returning structured clone-safe defaults

Register in `src/templates/registry.js` with:
- `fields` array using **dotted keys** for nested data (`box1.headline`)
- Admin form auto-generates from field schema — no manual form HTML per template

**Template draw functions**:
- Must call `ctx.clearRect(0, 0, w, h)` first (handled by `renderer.js`)
- Read colors/fonts from `theme` parameter, **never hardcoded hex**
- Use `wrapText()` helpers for multi-line text layout with canvas measurements

### Theme: CSS Variables as Single Source of Truth
```javascript
// ❌ WRONG — hardcoded color
ctx.fillStyle = '#1b4332';

// ✅ RIGHT — theme parameter from CSS vars
ctx.fillStyle = theme['color-box-bg'];
```

- `src/styles/theme.css` defines `--color-*` / `--font-*` 
- `src/canvas/theme.js` reads computed styles from hidden `#theme-probe` div
- Templates receive parsed `theme` object with camelCase keys
- Edit theme → changes propagate to canvas with no code changes

### Recording Architecture
Chrome-specific, requires `canvas.captureStream()` + `MediaRecorder` with VP9/VP8:

1. **Codec detection** (`src/recorder/export.js`): probe VP9 → VP8 → generic webm fallback
2. **Frame loop during recording**: `setInterval` at chosen FPS redraws canvas from scene state
3. **Sequential scenes**: "all scenes" mode calculates scene index from elapsed time
4. **Alpha preservation**: context created with `{ alpha: true }`, every frame starts with `clearRect`

## Key Files & Responsibilities

| Path | Purpose |
|------|---------|
| `src/templates/registry.js` | **CANVAS_WIDTH/HEIGHT constants** (390×844), template registration |
| `src/state/scenes.js` | Scene CRUD + localStorage sync. All mutations return modified `state` |
| `src/canvas/theme.js` | Bridge CSS variables → canvas context. Uses hidden `#theme-probe` element |
| `src/admin/ui.js` | Schema-driven form generation. Dotted key paths (`box1.text`) map to nested data |
| `src/recorder/export.js` | MediaRecorder wrapper. Handles draw loop, scene sequencing, blob download |

## Development Workflows

**Start dev server** (Node `^20.19.0` or `>=22.12.0` for Vite 8):
```bash
npm run dev  # → http://localhost:5173
```

**Test alpha transparency**:
1. Record a short clip (3s, single scene)
2. Download WebM
3. Check "Alpha check" playback area — transparent regions show checkerboard through video

**Chrome required for recording** — Safari/Firefox do not reliably encode alpha in WebM from captureStream.

## Common Patterns

### Adding a New Template
```javascript
// 1. Create src/templates/myTemplate.js
export function defaultMyTemplateData() {
  return { title: 'Hello', body: 'World' };
}

export function drawMyTemplate(ctx, data, w, h, theme) {
  // Layout + drawing logic using theme colors
}

// 2. Register in registry.js
import { drawMyTemplate, defaultMyTemplateData } from './myTemplate.js';

export const templates = {
  myTemplate: {
    id: 'myTemplate',
    label: 'My Template',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'body', label: 'Body text', type: 'textarea' },
    ],
    defaults: defaultMyTemplateData(),
    draw: drawMyTemplate,
  },
  // ...existing templates
};
```
Form UI auto-generates from `fields`. Use `type: 'textarea'` for multi-line input.

### Nested Data Paths
Admin form uses **dotted notation** for nested objects:
```javascript
fields: [
  { key: 'box1.headline', label: 'Box 1 headline', type: 'text' },
  { key: 'box1.text', label: 'Box 1 body', type: 'textarea' },
]
```
Maps to scene data structure:
```javascript
data: {
  box1: { headline: '...', text: '...' }
}
```
Helper functions in `src/state/scenes.js`: `getNestedValue(obj, 'box1.headline')`, `setNestedValue(obj, 'box1.headline', value)`.

### Canvas Text Layout
Templates in `src/templates/` use helper functions for text wrapping:
- `wrapText(ctx, text, maxWidth)` → array of line strings
- Measure with current `ctx.font` before calling
- Calculate total height: `lineCount * lineHeight` + gaps between elements

See `src/templates/twoBoxText.js` for complete example with headline + body layout.

## Constraints & Gotchas

- **No build-time transpilation** — code must run in modern Chrome directly (ES modules, `??`, `?.`)
- **Recording FPS**: canvas must redraw every frame during capture. Static canvas = frozen video
- **localStorage limits**: ~5MB typical. Scene data is JSON-serialized on every state change
- **Canvas dimensions**: 390×844 is **logical size**. CSS scales for preview; export records at 1:1
- **Alpha artifacts**: if transparency looks wrong, verify `ctx.clearRect` happens before every draw
- **Theme changes**: require canvas redraw. Admin calls `onChange` after state mutations

## Out of Scope

Per `AGENTS.md`:
- Backend / cloud storage — localStorage only
- Safari/Firefox recording workflows
- Automated ffmpeg post-processing (manual chroma-key fallback noted in `export.js`)
- Scene drag-and-drop reorder (state is arrays, UI not built)

## Testing Checklist for Changes

1. `npm run dev` in Chrome
2. Add/edit/delete scenes via admin UI
3. Switch templates, verify form updates
4. Record 3-second clip of current scene
5. Download WebM, play in "Alpha check" area
6. Refresh page → confirm localStorage persistence
7. Check browser console for errors
