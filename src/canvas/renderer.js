import { getTheme } from './theme.js';
import { getTemplate, CANVAS_WIDTH, CANVAS_HEIGHT } from '../templates/registry.js';

export function renderScene(ctx, scene) {
  const w = CANVAS_WIDTH;
  const h = CANVAS_HEIGHT;

  ctx.clearRect(0, 0, w, h);

  if (!scene) return;

  const template = getTemplate(scene.templateId);
  if (!template?.draw) return;

  const theme = getTheme();
  template.draw(ctx, scene.data, w, h, theme);
}

export function renderSceneToCanvas(canvas, scene) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;
  renderScene(ctx, scene);
}
