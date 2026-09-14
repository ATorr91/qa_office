// Generative chime engine for the character curtain. Every column is tuned to a
// degree of a pentatonic scale so that no matter which columns the cursor
// touches (or in what order), the resulting notes stay harmonically consonant.

const ROOT_HZ = 220; // A3
const PENTATONIC_DEGREES = [0, 2, 4, 7, 9]; // major pentatonic semitone offsets
const OCTAVE_RANGE = [-1, 0, 1, 2] as const;

function buildScale(): number[] {
  const freqs: number[] = [];
  OCTAVE_RANGE.forEach((octave) => {
    PENTATONIC_DEGREES.forEach((degree) => {
      freqs.push(ROOT_HZ * Math.pow(2, (degree + octave * 12) / 12));
    });
  });
  return freqs.sort((a, b) => a - b);
}

export class CurtainSoundEngine {
  private ctx: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private scale: number[] = buildScale();
  private lastPluckAt = 0;

  init() {
    if (this.ctx) return;
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2600;
    filter.Q.value = 0.4;

    const convolver = ctx.createConvolver();
    convolver.buffer = this.makeImpulse(ctx, 2.4, 2.6);

    const wetGain = ctx.createGain();
    wetGain.gain.value = 0.55;
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.45;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;

    filter.connect(dryGain);
    filter.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(masterGain);
    wetGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    this.filter = filter;
    this.masterGain = masterGain;
  }

  resume() {
    this.ctx?.resume();
  }

  setEnergy(gust: number) {
    if (!this.filter || !this.ctx) return;
    const target = 1800 + Math.min(gust, 2) * 3600;
    this.filter.frequency.setTargetAtTime(target, this.ctx.currentTime, 0.25);
  }

  pluck(noteIndex: number, velocity: number, brightness: number) {
    if (!this.ctx || !this.filter) return;
    const now = this.ctx.currentTime;
    if (now - this.lastPluckAt < 0.03) return; // guard against overlapping bursts
    this.lastPluckAt = now;

    const scaleLength = this.scale.length;
    const freq = this.scale[((noteIndex % scaleLength) + scaleLength) % scaleLength];
    const clampedVelocity = Math.min(1, Math.max(0, velocity));

    const osc = this.ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 6;

    const overtone = this.ctx.createOscillator();
    overtone.type = "triangle";
    overtone.frequency.value = freq * 2;

    const gain = this.ctx.createGain();
    const peak = 0.05 + clampedVelocity * 0.22;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.3 + clampedVelocity * 0.9);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0, now);
    overtoneGain.gain.linearRampToValueAtTime(peak * 0.22, now + 0.01);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.7);

    osc.connect(gain);
    overtone.connect(overtoneGain);
    gain.connect(this.filter);
    overtoneGain.connect(this.filter);

    this.filter.frequency.setTargetAtTime(1800 + brightness * 3600, now, 0.05);

    osc.start(now);
    overtone.start(now);
    osc.stop(now + 2.4);
    overtone.stop(now + 1.2);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    overtone.onended = () => {
      overtone.disconnect();
      overtoneGain.disconnect();
    };
  }

  private makeImpulse(ctx: AudioContext, duration: number, decay: number) {
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  dispose() {
    this.ctx?.close();
    this.ctx = null;
  }
}
