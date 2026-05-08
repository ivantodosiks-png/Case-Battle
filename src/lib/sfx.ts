"use client";

type Env = { ctx: AudioContext; master: GainNode };

let env: Env | null = null;

function getEnv(): Env | null {
  if (typeof window === "undefined") return null;
  if (env) return env;
  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioCtx = window.AudioContext || w.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx();
  const master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);
  env = { ctx, master };
  return env;
}

function tone(freq: number, durMs: number, type: OscillatorType, gain: number, when = 0) {
  const e = getEnv();
  if (!e) return;
  const t0 = e.ctx.currentTime + when;
  const osc = e.ctx.createOscillator();
  const g = e.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(g);
  g.connect(e.master);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.02);
}

function noiseBurst(durMs: number, gain: number, when = 0, hpHz = 1200) {
  const e = getEnv();
  if (!e) return;
  const t0 = e.ctx.currentTime + when;

  const buffer = e.ctx.createBuffer(1, Math.floor((e.ctx.sampleRate * durMs) / 1000), e.ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

  const src = e.ctx.createBufferSource();
  src.buffer = buffer;

  const hp = e.ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(hpHz, t0);

  const g = e.ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);

  src.connect(hp);
  hp.connect(g);
  g.connect(e.master);

  src.start(t0);
  src.stop(t0 + durMs / 1000 + 0.02);
}

export async function sfxPrime() {
  const e = getEnv();
  if (!e) return;
  if (e.ctx.state !== "running") await e.ctx.resume();
}

export function sfxSpinTick(intensity = 1) {
  // roulette-like click: short noise + tiny pitch blip (slightly randomized)
  const i = Math.max(0, Math.min(1, intensity));
  const r = Math.random();
  const dur = 14 + Math.floor(12 * r); // 14..26ms
  const hp = 1200 + 1200 * i + 700 * Math.random();
  const g = 0.04 + 0.09 * i;

  noiseBurst(dur, g, 0, hp);

  const base = 120 + 140 * i;
  const freq = base + 40 * (Math.random() - 0.5);
  tone(freq, 16 + 16 * r, r < 0.35 ? "square" : "triangle", 0.02 + 0.05 * i, 0.0);
}

export function sfxWin() {
  tone(659.25, 140, "triangle", 0.12);
  tone(880, 200, "triangle", 0.11, 0.05);
  tone(1318.5, 260, "sine", 0.10, 0.09);
}

export function sfxLose() {
  tone(196, 240, "sawtooth", 0.12);
  tone(146.8, 260, "sawtooth", 0.10, 0.06);
}

export function sfxCashback() {
  tone(523.25, 70, "sine", 0.07);
  tone(659.25, 90, "sine", 0.06, 0.04);
}
