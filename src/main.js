import './styles/theme.css';
import './styles/layout.css';

import { loadState, getActiveScene } from './state/scenes.js';
import { createAdminUI } from './admin/ui.js';
import { renderSceneToCanvas } from './canvas/renderer.js';
import {
  checkCapabilities,
  createRecorder,
  downloadBlob,
  setPlaybackVideo,
} from './recorder/export.js';

const canvas = document.getElementById('export-canvas');
const browserWarning = document.getElementById('browser-warning');
const capabilityStatus = document.getElementById('capability-status');
const recordBtn = document.getElementById('record-btn');
const stopBtn = document.getElementById('stop-btn');
const downloadBtn = document.getElementById('download-btn');
const recordStatus = document.getElementById('record-status');
const fpsSelect = document.getElementById('fps-select');
const durationInput = document.getElementById('duration-input');
const playbackVideo = document.getElementById('playback-video');

let state = loadState();
let recorder = null;
let lastBlob = null;

function refreshCanvas() {
  const scene = getActiveScene(state);
  renderSceneToCanvas(canvas, scene);
}

function showCapabilities() {
  const { ok, mime, issues } = checkCapabilities();
  capabilityStatus.className = 'capability-status ' + (ok ? 'ok' : 'warn');

  if (ok) {
    capabilityStatus.textContent = `Ready — ${mime}. Use Chrome for best alpha support.`;
  } else {
    capabilityStatus.textContent = issues.join(' ');
    browserWarning.hidden = false;
    browserWarning.textContent = issues.join(' ');
  }

  recordBtn.disabled = !ok;
}

function getRecordMode() {
  return document.querySelector('input[name="record-mode"]:checked')?.value ?? 'current';
}

function setRecordingUI(isRecording) {
  recordBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;
  fpsSelect.disabled = isRecording;
  durationInput.disabled = isRecording;
  document.querySelectorAll('input[name="record-mode"]').forEach((el) => {
    el.disabled = isRecording;
  });
}

async function startRecording() {
  const { ok } = checkCapabilities();
  if (!ok) return;

  const fps = Number(fpsSelect.value) || 30;
  const durationSec = Math.max(1, Number(durationInput.value) || 3);
  const mode = getRecordMode();
  const scenes =
    mode === 'all' ? state.scenes : [getActiveScene(state)];

  try {
    recorder = createRecorder(canvas, {
      fps,
      onStatus: (msg) => {
        recordStatus.textContent = msg;
      },
    });

    setRecordingUI(true);
    recordStatus.textContent = 'Recording…';

    lastBlob = await recorder.start(scenes, durationSec, mode);
    if (lastBlob?.size) {
      downloadBtn.disabled = false;
      setPlaybackVideo(playbackVideo, lastBlob);
      recordStatus.textContent = `Done — ${(lastBlob.size / 1024).toFixed(0)} KB`;
    }
  } catch (err) {
    recordStatus.textContent = err.message ?? 'Recording failed';
  } finally {
    setRecordingUI(false);
  }
}

function stopRecording() {
  recorder?.stop();
  setRecordingUI(false);
  recordStatus.textContent = 'Stopped';
}

createAdminUI(state, {
  onChange: () => {
    if (!recorder?.isRecording?.()) refreshCanvas();
  },
});

recordBtn.addEventListener('click', startRecording);
stopBtn.addEventListener('click', stopRecording);
downloadBtn.addEventListener('click', () => {
  if (lastBlob) downloadBlob(lastBlob, 'overlay-alpha.webm');
});

showCapabilities();
refreshCanvas();
