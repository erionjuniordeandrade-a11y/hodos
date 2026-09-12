import test from 'node:test';
import assert from 'node:assert/strict';
import { createCaseAudio } from '../../viewer/case_audio.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function streamWithTracks(count = 1) {
  const tracks = Array.from({ length: count }, () => ({ stopCalls: 0, stop() { this.stopCalls += 1; } }));
  return { tracks, getTracks() { return tracks; } };
}

class FakeRecorder {
  static instances = [];

  constructor(stream) {
    this.stream = stream;
    this.mimeType = 'audio/webm';
    this.state = 'inactive';
    this.stopCalls = 0;
    FakeRecorder.instances.push(this);
  }

  start() { this.state = 'recording'; }

  stop() {
    this.stopCalls += 1;
    this.state = 'inactive';
  }

  emitData(text) {
    this.ondataavailable?.({ data: new Blob([text], { type: this.mimeType }) });
  }

  emitStop() { this.onstop?.(); }

  emitError(error = new Error('device stopped')) { this.onerror?.({ error }); }
}

function recorderFactory() {
  FakeRecorder.instances = [];
  return FakeRecorder;
}

test('empty recording reports failure and releases tracks', async () => {
 const stream=streamWithTracks(),Recorder=recorderFactory();
 const audio=createCaseAudio({Recorder,getUserMedia:async()=>stream});
 await audio.start();const stopping=audio.stop();Recorder.instances[0].emitStop();await stopping;
 assert.equal(audio.state.status,'error');assert.equal(audio.state.blob,null);
 assert.match(audio.state.error,/No audio/);assert.equal(stream.tracks[0].stopCalls,1);
});

test('permission denial becomes an actionable error', async () => {
  const changes = [];
  const Recorder = recorderFactory();
  const audio = createCaseAudio({
    Recorder,
    getUserMedia: async () => {
      const error = new Error('blocked by browser');
      error.name = 'NotAllowedError';
      throw error;
    },
    onChange: state => changes.push(state),
  });

  await assert.rejects(audio.start(), /Microphone access was denied/i);
  assert.equal(audio.state.status, 'error');
  assert.match(audio.state.error, /Allow microphone access/i);
  assert.deepEqual(changes.map(state => state.status), ['requesting', 'error']);
  await audio.stop();
});

test('successful recording collects final chunks and stops every track after onstop', async () => {
  const stream = streamWithTracks(2);
  const constraints = [];
  const changes = [];
  const Recorder = recorderFactory();
  const audio = createCaseAudio({
    Recorder,
    getUserMedia: async options => { constraints.push(options); return stream; },
    onChange: state => changes.push(state),
  });

  await audio.start();
  assert.equal(audio.state.status, 'recording');
  assert.deepEqual(constraints, [{ audio: true }]);
  const recorder = Recorder.instances[0];
  recorder.emitData('first-');
  const stopping = audio.stop();
  assert.equal(audio.state.status, 'stopping');
  assert.equal(audio.state.blob, null);
  assert.equal(recorder.stopCalls, 1);

  recorder.emitData('final');
  recorder.emitStop();
  await stopping;

  assert.equal(audio.state.status, 'ready');
  assert.equal(audio.state.error, '');
  assert.equal(await audio.state.blob.text(), 'first-final');
  assert.deepEqual(stream.tracks.map(track => track.stopCalls), [1, 1]);
  assert.deepEqual(changes.map(state => state.status), ['requesting', 'recording', 'stopping', 'ready']);
});

test('dispose during pending permission settles start and stops a late stream', async () => {
  const request = deferred();
  const stream = streamWithTracks();
  const changes = [];
  const audio = createCaseAudio({
    Recorder: recorderFactory(),
    getUserMedia: () => request.promise,
    onChange: state => changes.push(state),
  });

  const starting = audio.start();
  assert.equal(audio.state.status, 'requesting');
  audio.dispose();
  await starting;
  assert.equal(audio.state.status, 'idle');
  assert.equal(audio.state.blob, null);

  request.resolve(stream);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(stream.tracks[0].stopCalls, 1);
  assert.deepEqual(changes.map(state => state.status), ['requesting', 'idle']);
});

test('stop during pending permission cancels cleanly and stops the late stream', async () => {
  const request = deferred();
  const stream = streamWithTracks();
  const audio = createCaseAudio({ Recorder: recorderFactory(), getUserMedia: () => request.promise });

  const starting = audio.start();
  const stopping = audio.stop();
  await stopping;
  await starting;
  request.resolve(stream);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(audio.state.status, 'idle');
  assert.equal(stream.tracks[0].stopCalls, 1);
});

test('discard invalidates late recorder events and resolves an in-flight stop', async () => {
  const stream = streamWithTracks();
  const Recorder = recorderFactory();
  const audio = createCaseAudio({ Recorder, getUserMedia: async () => stream });

  await audio.start();
  const oldRecorder = Recorder.instances[0];
  oldRecorder.emitData('discarded');
  const stopping = audio.stop();
  audio.discard();
  await stopping;
  assert.equal(audio.state.status, 'idle');
  assert.equal(audio.state.blob, null);
  assert.equal(stream.tracks[0].stopCalls, 1);

  oldRecorder.emitData('late');
  oldRecorder.emitStop();
  assert.equal(audio.state.status, 'idle');
  assert.equal(audio.state.blob, null);
});

test('a stale recorder cannot replace a newer attempt', async () => {
  const firstStream = streamWithTracks();
  const secondStream = streamWithTracks();
  const streams = [firstStream, secondStream];
  const Recorder = recorderFactory();
  const audio = createCaseAudio({ Recorder, getUserMedia: async () => streams.shift() });

  await audio.start();
  const oldRecorder = Recorder.instances[0];
  const firstStop = audio.stop();
  audio.discard();
  await firstStop;
  await audio.start();
  const newRecorder = Recorder.instances[1];
  oldRecorder.emitData('old');
  oldRecorder.emitStop();
  assert.equal(audio.state.status, 'recording');
  newRecorder.emitData('new');
  const secondStop = audio.stop();
  newRecorder.emitStop();
  await secondStop;
  assert.equal(await audio.state.blob.text(), 'new');
  assert.equal(firstStream.tracks[0].stopCalls, 1);
  assert.equal(secondStream.tracks[0].stopCalls, 1);
});

test('recorder errors stop tracks and resolve stop without leaving a stale recording', async () => {
  const stream = streamWithTracks();
  const Recorder = recorderFactory();
  const audio = createCaseAudio({ Recorder, getUserMedia: async () => stream });

  await audio.start();
  const recorder = Recorder.instances[0];
  const stopping = audio.stop();
  const error = new Error('microphone unplugged');
  recorder.emitError(error);
  await stopping;
  assert.equal(audio.state.status, 'error');
  assert.match(audio.state.error, /Recording failed/i);
  assert.equal(stream.tracks[0].stopCalls, 1);
});
