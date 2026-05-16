import { renderScene } from '../canvas/renderer.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../templates/registry.js';

// Fallback if alpha is lost in export: record on chroma green canvas, then:
// ffmpeg -i in.webm -c:v libvpx -vf "chromakey=0x00ff00:0.1:0.1,format=yuva420p" -auto-alt-ref 0 out.webm

export function getSupportedMimeType() {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

export function checkCapabilities() {
  const issues = [];
  if (typeof MediaRecorder === 'undefined') {
    issues.push('MediaRecorder is not available in this browser.');
  }
  const mime = getSupportedMimeType();
  if (!mime) {
    issues.push('No supported WebM codec found for recording.');
  }
  return { ok: issues.length === 0, mime, issues };
}

export function createRecorder(canvas, { fps = 30, onStatus } = {}) {
  const mimeType = getSupportedMimeType();
  if (!mimeType) throw new Error('Recording not supported');

  const ctx = canvas.getContext('2d', { alpha: true });
  const stream = canvas.captureStream(fps);
  const chunks = [];
  let recorder = null;
  let intervalId = null;
  let recording = false;
  let lastBlob = null;

  function drawFrame(scene) {
    renderScene(ctx, scene);
  }

  function startDrawLoop(scenes, sceneDurationMs, getSceneAtTime) {
    const startTime = performance.now();
    const frameInterval = 1000 / fps;

    intervalId = setInterval(() => {
      if (!recording) return;
      const elapsed = performance.now() - startTime;
      const scene = getSceneAtTime ? getSceneAtTime(elapsed) : scenes[0];
      drawFrame(scene);
    }, frameInterval);

    drawFrame(getSceneAtTime ? scenes[0] : scenes[0]);
    onStatus?.(`Recording… ${(sceneDurationMs / 1000).toFixed(1)}s per segment`);
  }

  function stopDrawLoop() {
    if (intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    get mimeType() {
      return mimeType;
    },
    get lastBlob() {
      return lastBlob;
    },
    start(scenes, durationSec, mode) {
      if (recording) return;
      recording = true;
      chunks.length = 0;

      const durationMs = durationSec * 1000;
      const sceneList = Array.isArray(scenes) ? scenes : [scenes];

      let getSceneAtTime = null;
      if (mode === 'all' && sceneList.length > 1) {
        const segmentMs = durationMs;
        getSceneAtTime = (elapsed) => {
          const index = Math.min(
            Math.floor(elapsed / segmentMs),
            sceneList.length - 1,
          );
          return sceneList[index];
        };
      }

      const totalMs =
        mode === 'all' && sceneList.length > 1
          ? durationMs * sceneList.length
          : durationMs;

      drawFrame(getSceneAtTime ? sceneList[0] : sceneList[0]);

      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        stopDrawLoop();
        recording = false;
        lastBlob = new Blob(chunks, { type: mimeType });
        onStatus?.('Recording complete');
      };

      recorder.onerror = () => {
        stopDrawLoop();
        recording = false;
        onStatus?.('Recording error');
      };

      startDrawLoop(sceneList, durationMs, getSceneAtTime);
      recorder.start(100);

      return new Promise((resolve) => {
        setTimeout(() => {
          if (recorder?.state === 'recording') {
            recorder.stop();
          }
          setTimeout(() => resolve(lastBlob), 150);
        }, totalMs);
      });
    },
    stop() {
      if (recorder?.state === 'recording') {
        recorder.stop();
      } else {
        stopDrawLoop();
        recording = false;
      }
    },
    isRecording() {
      return recording;
    },
  };
}

export function downloadBlob(blob, filename = 'overlay.webm') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function setPlaybackVideo(videoEl, blob) {
  if (!videoEl || !blob) return;
  if (videoEl.src) URL.revokeObjectURL(videoEl.src);
  videoEl.src = URL.createObjectURL(blob);
  videoEl.load();
}
