const ACTIVE_STATUSES = new Set(['requesting', 'recording', 'stopping']);
const START_ERROR = 'Audio recording could not be started. Check microphone permissions and try again.';

function stopTracks(stream) {
  if (!stream || typeof stream.getTracks !== 'function') return;
  let tracks;
  try { tracks = stream.getTracks(); } catch { return; }
  for (const track of tracks || []) try { track?.stop?.(); } catch {}
}

function mediaError(error) {
  const name = error?.name;
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError')
    return 'Microphone access was denied. Allow microphone access in browser settings and try again.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError')
    return 'No microphone was found. Connect a microphone and try again.';
  if (name === 'NotReadableError' || name === 'TrackStartError')
    return 'The microphone is busy or unavailable. Close other audio apps and try again.';
  return error?.message
    ? `Microphone access failed: ${error.message} Check browser permissions and try again.`
    : 'Microphone access failed. Check browser permissions and try again.';
}

function recordingError(error) {
  const detail = error?.error?.message || error?.message;
  return detail ? `Recording failed: ${detail}. Try again.`
    : 'Recording failed. Check microphone permissions and try again.';
}

function thrown(message, cause) {
  const error = new Error(message);
  if (cause) error.cause = cause;
  return error;
}

export function createCaseAudio({ getUserMedia, Recorder, onChange = () => {} } = {}) {
  let state = Object.freeze({ status: 'idle', blob: null, error: '' });
  let generation = 0, stream = null, recorder = null, chunks = [];
  let pendingStart = null, stopPromise = null, resolveStop = null, disposed = false;

  const emit = patch => {
    state = Object.freeze({ ...state, ...patch });
    onChange(state);
    return state;
  };
  const current = (id, rec = null) => !disposed && id === generation && (!rec || recorder === rec);
  const releaseStream = () => { const old = stream; stream = null; stopTracks(old); };
  const detach = rec => {
    if (!rec) return;
    try { rec.ondataavailable = null; rec.onstop = null; rec.onerror = null; } catch {}
  };
  const clearResources = () => { const old = recorder; recorder = null; detach(old); releaseStream(); chunks = []; };
  const settleStop = () => {
    if (!resolveStop) return;
    const resolve = resolveStop;
    resolveStop = null;
    stopPromise = null;
    resolve();
  };
  const cancelPending = () => {
    if (!pendingStart) return;
    const pending = pendingStart;
    pendingStart = null;
    pending.resolve();
  };

  function invalidate() {
    generation += 1;
    cancelPending();
    const oldRecorder = recorder;
    if (oldRecorder && typeof oldRecorder.stop === 'function' && oldRecorder.state !== 'inactive') {
      try { oldRecorder.stop(); } catch {}
    }
    clearResources();
    settleStop();
  }

  function fail(id, rec, message) {
    if (!current(id, rec)) return false;
    generation += 1;
    clearResources();
    emit({ status: 'error', blob: null, error: message });
    settleStop();
    return true;
  }

  function complete(id, rec) {
    if (!current(id, rec)) return;
    let blob;
    try { blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' }); }
    catch (error) { fail(id, rec, recordingError(error)); return; }
    if (!blob.size) { fail(id, rec, 'No audio was captured. Try recording again or use a written response.'); return; }
    generation += 1;
    clearResources();
    emit({ status: 'ready', blob, error: '' });
    settleStop();
  }

  async function start() {
    if (disposed) throw thrown('Audio recorder has been disposed. Create a new recorder to try again.');
    if (ACTIVE_STATUSES.has(state.status))
      throw thrown('A recording is already in progress. Stop or discard it before starting again.');
    const id = ++generation;
    chunks = [];
    clearResources();
    emit({ status: 'requesting', blob: null, error: '' });

    const request = Promise.resolve().then(() => {
      if (typeof getUserMedia === 'function') return getUserMedia({ audio: true });
      const devices = globalThis.navigator?.mediaDevices;
      if (typeof devices?.getUserMedia !== 'function')
        throw thrown('Microphone capture is unavailable in this browser.');
      return devices.getUserMedia({ audio: true });
    });
    const cancelled = new Promise(resolve => { pendingStart = { id, resolve }; });
    const outcome = await Promise.race([
      request.then(value => ({ value }), error => ({ error })),
      cancelled.then(() => ({ cancelled: true })),
    ]);
    if (pendingStart?.id === id) pendingStart = null;
    if (outcome.cancelled) {
      request.then(value => stopTracks(value), () => {});
      return;
    }
    if (outcome.error) {
      if (!current(id)) return;
      const message = mediaError(outcome.error);
      fail(id, null, message);
      throw thrown(message, outcome.error);
    }
    const acquired = outcome.value;
    if (!current(id)) { stopTracks(acquired); return; }
    if (!acquired || typeof acquired.getTracks !== 'function') {
      const message = 'Microphone capture returned no usable stream. Check browser permissions and try again.';
      fail(id, null, message);
      throw thrown(message);
    }
    stream = acquired;
    const RecorderCtor = Recorder ?? globalThis.MediaRecorder;
    if (typeof RecorderCtor !== 'function') {
      const message = 'Audio recording is unavailable in this browser.';
      fail(id, null, message);
      throw thrown(message);
    }
    let rec;
    try { rec = new RecorderCtor(acquired); }
    catch (error) {
      fail(id, null, START_ERROR);
      throw thrown(START_ERROR, error);
    }
    if (!current(id)) { stopTracks(acquired); return; }
    recorder = rec;
    rec.ondataavailable = event => { if (!current(id, rec)) return;
      const data = event?.data;
      if (data && (typeof data.size !== 'number' || data.size > 0)) chunks.push(data); };
    rec.onstop = () => complete(id, rec);
    rec.onerror = event => fail(id, rec, recordingError(event));
    emit({ status: 'recording', blob: null, error: '' });
    if (!current(id, rec)) return;
    try { rec.start(); }
    catch (error) {
      fail(id, rec, START_ERROR);
      throw thrown(START_ERROR, error);
    }
  }

  function stop() {
    if (disposed || state.status === 'idle' || state.status === 'ready' || state.status === 'error')
      return Promise.resolve();
    if (state.status === 'requesting') {
      invalidate();
      emit({ status: 'idle', blob: null, error: '' });
      return Promise.resolve();
    }
    if (stopPromise) return stopPromise;
    let completionResolve;
    const completion = new Promise(resolve => { completionResolve = resolve; });
    stopPromise = completion;
    resolveStop = completionResolve;
    const id = generation, rec = recorder;
    emit({ status: 'stopping' });
    if (!current(id, rec)) { settleStop(); return completion; }
    try {
      if (!rec || typeof rec.stop !== 'function') throw thrown('Audio recorder cannot be stopped.');
      rec.stop();
    } catch (error) { fail(id, rec, recordingError(error)); }
    return completion;
  }

  function discard() {
    if (disposed) return;
    invalidate();
    emit({ status: 'idle', blob: null, error: '' });
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    invalidate();
    emit({ status: 'idle', blob: null, error: '' });
  }

  return { start, stop, discard, dispose, get state() { return state; } };
}
