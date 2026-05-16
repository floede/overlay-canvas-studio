import { getTemplate, listTemplates } from '../templates/registry.js';
import {
  getActiveScene,
  setActiveScene,
  addScene,
  deleteScene,
  updateSceneData,
  updateSceneLabel,
  setSceneTemplate,
  getNestedValue,
  setNestedValue,
  downloadScenesAsJSON,
  loadScenesFromFile,
  saveState,
  updateCollectionName,
} from '../state/scenes.js';

function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function createAdminUI(state, { onChange }) {
  const sceneListEl = document.getElementById('scene-list');
  const sceneFormEl = document.getElementById('scene-form');
  const addSceneBtn = document.getElementById('add-scene-btn');
  const exportScenesBtn = document.getElementById('export-scenes-btn');
  const importScenesBtn = document.getElementById('import-scenes-btn');
  const importScenesFile = document.getElementById('import-scenes-file');
  const collectionNameInput = document.getElementById('collection-name-input');

  const notify = debounce(() => onChange(state), 50);
  
  // Initialize collection name input
  collectionNameInput.value = state.collectionName || '';
  collectionNameInput.addEventListener('input', () => {
    updateCollectionName(state, collectionNameInput.value);
  });

  function renderSceneList() {
    sceneListEl.innerHTML = '';
    const active = getActiveScene(state);

    for (const scene of state.scenes) {
      const li = document.createElement('li');
      li.className = 'scene-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'scene-item-btn' + (scene.id === active?.id ? ' active' : '');
      btn.textContent = scene.label || scene.templateId;
      btn.addEventListener('click', () => {
        setActiveScene(state, scene.id);
        render();
        notify();
      });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'scene-item-delete';
      del.title = 'Delete scene';
      del.textContent = '×';
      del.addEventListener('click', () => {
        if (state.scenes.length <= 1) return;
        if (!confirm(`Delete "${scene.label || 'scene'}"?`)) return;
        deleteScene(state, scene.id);
        render();
        notify();
      });

      li.append(btn, del);
      sceneListEl.appendChild(li);
    }
  }

  function renderForm() {
    const scene = getActiveScene(state);
    sceneFormEl.innerHTML = '';
    if (!scene) return;

    const template = getTemplate(scene.templateId);
    if (!template) return;

    const labelField = document.createElement('div');
    labelField.className = 'form-field';
    labelField.innerHTML = `<label>Scene name</label>`;
    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.value = scene.label ?? '';
    labelInput.addEventListener('input', () => {
      updateSceneLabel(state, scene.id, labelInput.value);
      renderSceneList();
    });
    labelField.appendChild(labelInput);
    sceneFormEl.appendChild(labelField);

    const templateField = document.createElement('div');
    templateField.className = 'form-field';
    const templateLabel = document.createElement('label');
    templateLabel.textContent = 'Template';
    templateField.appendChild(templateLabel);

    const templateSelect = document.createElement('select');
    for (const t of listTemplates()) {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.label;
      option.selected = t.id === scene.templateId;
      templateSelect.appendChild(option);
    }
    templateSelect.addEventListener('change', () => {
      const nextId = templateSelect.value;
      if (nextId === scene.templateId) return;
      const nextTemplate = getTemplate(nextId);
      if (
        !confirm(
          `Switch to "${nextTemplate?.label ?? nextId}"? Scene content will reset to that template's defaults.`,
        )
      ) {
        templateSelect.value = scene.templateId;
        return;
      }
      setSceneTemplate(state, scene.id, nextId);
      render();
      notify();
    });
    templateField.appendChild(templateSelect);
    sceneFormEl.appendChild(templateField);

    for (const field of template.fields) {
      const wrap = document.createElement('div');
      wrap.className = 'form-field';

      const label = document.createElement('label');
      label.textContent = field.label;
      wrap.appendChild(label);

      const value = getNestedValue(scene.data, field.key) ?? '';

      if (field.type === 'textarea') {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.addEventListener('input', () => {
          setNestedValue(scene.data, field.key, textarea.value);
          updateSceneData(state, scene.id, scene.data);
          notify();
        });
        wrap.appendChild(textarea);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.addEventListener('input', () => {
          setNestedValue(scene.data, field.key, input.value);
          updateSceneData(state, scene.id, scene.data);
          notify();
        });
        wrap.appendChild(input);
      }

      sceneFormEl.appendChild(wrap);
    }
  }

  function render() {
    renderSceneList();
    renderForm();
  }

  addSceneBtn.addEventListener('click', () => {
    const available = listTemplates();
    if (available.length === 1) {
      addScene(state, available[0].id);
    } else {
      const ids = available.map((t) => t.id).join(', ');
      const choice = prompt(`Template id (${ids}):`, available[0]?.id ?? 'twoBoxText');
      if (choice && getTemplate(choice)) addScene(state, choice);
    }
    render();
    notify();
  });

  exportScenesBtn.addEventListener('click', () => {
    downloadScenesAsJSON(state);
  });

  importScenesBtn.addEventListener('click', () => {
    importScenesFile.click();
  });

  importScenesFile.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await loadScenesFromFile(file);
      
      const displayName = imported.collectionName || 'Untitled';
      if (!confirm(`Import "${displayName}" (${imported.scenes.length} scene(s))? This will replace your current scenes.`)) {
        importScenesFile.value = '';
        return;
      }
      
      state.scenes = imported.scenes;
      state.activeId = imported.activeId;
      state.collectionName = imported.collectionName;
      saveState(state.scenes, state.activeId, state.collectionName);
      
      collectionNameInput.value = state.collectionName || '';
      render();
      notify();
      
      alert(`Successfully imported "${displayName}" (${imported.scenes.length} scene(s))!`);
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      importScenesFile.value = '';
    }
  });

  render();

  return { render };
}
