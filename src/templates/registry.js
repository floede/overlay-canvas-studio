import { drawTwoBoxText, defaultTwoBoxData } from './twoBoxText.js';

export const CANVAS_WIDTH = 390;
export const CANVAS_HEIGHT = 844;

export const templates = {
  twoBoxText: {
    id: 'twoBoxText',
    label: 'Two boxes with text',
    fields: [
      { key: 'box1.headline', label: 'Box 1 headline', type: 'text' },
      { key: 'box1.text', label: 'Box 1 text', type: 'textarea' },
      { key: 'box2.headline', label: 'Box 2 headline', type: 'text' },
      { key: 'box2.text', label: 'Box 2 text', type: 'textarea' },
    ],
    defaults: defaultTwoBoxData(),
    draw: drawTwoBoxText,
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
