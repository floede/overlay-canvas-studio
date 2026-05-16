import { drawCenterBox, defaultCenterBoxData } from './centerBox.js';
import { drawTwoBoxText, defaultTwoBoxData } from './twoBoxText.js';
import { drawProgress, defaultProgressData } from './progress.js';

export const CANVAS_WIDTH = 390;
export const CANVAS_HEIGHT = 844;

export const templates = {
  centerBox: {
    id: 'centerBox',
    label: 'Center box',
    fields: [{ key: 'headline', label: 'Headline', type: 'text' }],
    defaults: defaultCenterBoxData(),
    draw: drawCenterBox,
  },
  twoBoxText: {
    id: 'twoBoxText',
    label: 'Two boxes with text',
    fields: [
      { key: 'box1.headline', label: 'Box 1 headline', type: 'text' },
      { key: 'box1.text', label: 'Box 1 text', type: 'textarea' },
      { key: 'box2.headline', label: 'Box 2 headline', type: 'text' },
      { key: 'box2.text', label: 'Box 2 text', type: 'textarea' },
      { key: 'box2.percentage', label: 'Box 2 percentage (0-100, optional)', type: 'text' },
    ],
    defaults: defaultTwoBoxData(),
    draw: drawTwoBoxText,
  },
  progress: {
    id: 'progress',
    label: 'Progress tracking',
    fields: [
      { key: 'box1.headline', label: 'Box 1 headline', type: 'text' },
      { key: 'box1.text', label: 'Box 1 text', type: 'textarea' },
      { key: 'box2.headline', label: 'Box 2 headline', type: 'text' },
      { key: 'box2.progress1Name', label: 'Progress 1 name', type: 'text' },
      { key: 'box2.progress1Current', label: 'Progress 1 current', type: 'text' },
      { key: 'box2.progress1Total', label: 'Progress 1 total', type: 'text' },
      { key: 'box2.progress2Name', label: 'Progress 2 name', type: 'text' },
      { key: 'box2.progress2Current', label: 'Progress 2 current', type: 'text' },
      { key: 'box2.progress2Total', label: 'Progress 2 total', type: 'text' },
      { key: 'box2.progress3Name', label: 'Progress 3 name', type: 'text' },
      { key: 'box2.progress3Current', label: 'Progress 3 current', type: 'text' },
      { key: 'box2.progress3Total', label: 'Progress 3 total', type: 'text' },
      { key: 'box2.progress4Name', label: 'Progress 4 name', type: 'text' },
      { key: 'box2.progress4Current', label: 'Progress 4 current', type: 'text' },
      { key: 'box2.progress4Total', label: 'Progress 4 total', type: 'text' },
    ],
    defaults: defaultProgressData(),
    draw: drawProgress,
  },
};

export function getTemplate(templateId) {
  return templates[templateId] ?? null;
}

export function listTemplates() {
  return Object.values(templates);
}

export function createSceneData(templateId) {
  const template = getTemplate(templateId);
  if (!template) return null;
  return structuredClone(template.defaults);
}
