import { createSceneData, getTemplate } from '../templates/registry.js';

const STORAGE_KEY = 'overlay-canvas-studio-scenes';
const ACTIVE_KEY = 'overlay-canvas-studio-active';
const COLLECTION_NAME_KEY = 'overlay-canvas-studio-collection-name';

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
    const collectionName = localStorage.getItem(COLLECTION_NAME_KEY) || '';
    if (raw) {
      const scenes = JSON.parse(raw);
      if (Array.isArray(scenes) && scenes.length > 0) {
        const validActive =
          activeId && scenes.some((s) => s.id === activeId)
            ? activeId
            : scenes[0].id;
        return { scenes, activeId: validActive, collectionName };
      }
    }
  } catch {
    /* use defaults */
  }

  const scenes = defaultScenes();
  return { scenes, activeId: scenes[0].id, collectionName: '' };
}

export function saveState(scenes, activeId, collectionName = '') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  localStorage.setItem(ACTIVE_KEY, activeId);
  localStorage.setItem(COLLECTION_NAME_KEY, collectionName);
}

export function getActiveScene(state) {
  return state.scenes.find((s) => s.id === state.activeId) ?? state.scenes[0];
}

export function setActiveScene(state, id) {
  state.activeId = id;
  saveState(state.scenes, state.activeId, state.collectionName);
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
  saveState(state.scenes, state.activeId, state.collectionName);
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
  saveState(state.scenes, state.activeId, state.collectionName);
  return state;
}

export function updateSceneData(state, id, data) {
  const scene = state.scenes.find((s) => s.id === id);
  if (!scene) return state;
  scene.data = data;
  saveState(state.scenes, state.activeId, state.collectionName);
  return state;
}

export function updateSceneLabel(state, id, label) {
  const scene = state.scenes.find((s) => s.id === id);
  if (!scene) return state;
  scene.label = label;
  saveState(state.scenes, state.activeId, state.collectionName);
  return state;
}

export function setSceneTemplate(state, id, templateId) {
  const scene = state.scenes.find((s) => s.id === id);
  const template = getTemplate(templateId);
  if (!scene || !template || scene.templateId === templateId) return state;

  scene.templateId = templateId;
  scene.data = createSceneData(templateId);
  saveState(state.scenes, state.activeId, state.collectionName);
  return state;
}

export function updateCollectionName(state, name) {
  state.collectionName = name;
  saveState(state.scenes, state.activeId, state.collectionName);
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

export function exportScenesToJSON(state) {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    collectionName: state.collectionName || '',
    scenes: state.scenes,
    activeId: state.activeId,
  };
  return JSON.stringify(exportData, null, 2);
}

export function downloadScenesAsJSON(state, filename = null) {
  const json = exportScenesToJSON(state);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  
  // Use collection name in filename if available
  if (!filename) {
    const timestamp = new Date().toISOString().split('T')[0];
    const safeName = state.collectionName 
      ? state.collectionName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
      : 'overlay-scenes';
    filename = `${safeName}-${timestamp}.json`;
  }
  
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function importScenesFromJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate structure
    if (!data.scenes || !Array.isArray(data.scenes) || data.scenes.length === 0) {
      throw new Error('Invalid scenes data: must contain a non-empty scenes array');
    }
    
    // Validate each scene has required fields
    for (const scene of data.scenes) {
      if (!scene.id || !scene.templateId || !scene.data) {
        throw new Error('Invalid scene structure: missing required fields');
      }
      
      // Validate template exists
      const template = getTemplate(scene.templateId);
      if (!template) {
        throw new Error(`Unknown template: ${scene.templateId}`);
      }
    }
    
    // Ensure activeId is valid
    const activeId = data.activeId && data.scenes.some(s => s.id === data.activeId)
      ? data.activeId
      : data.scenes[0].id;
    
    const collectionName = data.collectionName || '';
    
    return { scenes: data.scenes, activeId, collectionName };
  } catch (err) {
    throw new Error(`Failed to import scenes: ${err.message}`);
  }
}

export function loadScenesFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = importScenesFromJSON(e.target.result);
        resolve(state);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
