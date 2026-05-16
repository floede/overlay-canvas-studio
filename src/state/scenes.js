import { createSceneData, getTemplate } from '../templates/registry.js';

const STORAGE_KEY = 'overlay-canvas-studio-scenes';
const ACTIVE_KEY = 'overlay-canvas-studio-active';

function generateId() {
  return crypto.randomUUID();
}

function defaultScenes() {
  const template = getTemplate('twoBoxText');
  return [
    {
      id: generateId(),
      templateId: 'twoBoxText',
      label: 'Scene 1',
      data: createSceneData('twoBoxText'),
    },
    {
      id: generateId(),
      templateId: 'twoBoxText',
      label: 'Scene 2',
      data: {
        box1: {
          headline: 'Key takeaway',
          text: 'Use this overlay on top of your video footage.',
        },
        box2: {
          headline: 'Transparent export',
          text: 'Record as WebM with alpha in Chrome for compositing.',
        },
      },
    },
  ];
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
      const scenes = JSON.parse(raw);
      if (Array.isArray(scenes) && scenes.length > 0) {
        const validActive =
          activeId && scenes.some((s) => s.id === activeId)
            ? activeId
            : scenes[0].id;
        return { scenes, activeId: validActive };
      }
    }
  } catch {
    /* use defaults */
  }

  const scenes = defaultScenes();
  return { scenes, activeId: scenes[0].id };
}

export function saveState(scenes, activeId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  localStorage.setItem(ACTIVE_KEY, activeId);
}

export function getActiveScene(state) {
  return state.scenes.find((s) => s.id === state.activeId) ?? state.scenes[0];
}

export function setActiveScene(state, id) {
  state.activeId = id;
  saveState(state.scenes, state.activeId);
  return state;
}

export function addScene(state, templateId = 'twoBoxText') {
  const template = getTemplate(templateId);
  if (!template) return state;

  const scene = {
    id: generateId(),
    templateId,
    label: `Scene ${state.scenes.length + 1}`,
    data: createSceneData(templateId),
  };

  state.scenes.push(scene);
  state.activeId = scene.id;
  saveState(state.scenes, state.activeId);
  return state;
}

export function deleteScene(state, id) {
  if (state.scenes.length <= 1) return state;

  const index = state.scenes.findIndex((s) => s.id === id);
  if (index === -1) return state;

  state.scenes.splice(index, 1);
  if (state.activeId === id) {
    state.activeId = state.scenes[Math.max(0, index - 1)].id;
  }
  saveState(state.scenes, state.activeId);
  return state;
}

export function updateSceneData(state, id, data) {
  const scene = state.scenes.find((s) => s.id === id);
  if (!scene) return state;
  scene.data = data;
  saveState(state.scenes, state.activeId);
  return state;
}

export function updateSceneLabel(state, id, label) {
  const scene = state.scenes.find((s) => s.id === id);
  if (!scene) return state;
  scene.label = label;
  saveState(state.scenes, state.activeId);
  return state;
}

export function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (current[keys[i]] == null) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
