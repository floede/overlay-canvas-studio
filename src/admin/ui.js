import { getTemplate, listTemplates } from '../templates/registry.js';
import {
  getActiveScene,
  setActiveScene,
  addScene,
  deleteScene,
  updateSceneData,
  updateSceneLabel,
  getNestedValue,
  setNestedValue,
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

  const notify = debounce(() => onChange(state), 50);

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

  render();

  return { render };
}
