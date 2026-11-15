/**
 * @license
 * SPDX-License-Identifier: MIT
 * Relaxation & Sleep Frequency Audio Engine for Nebula Core
 */

import { globalPiano } from './pianoEngine';

export interface SolfeggioTone {
  id: string;
  name: string;
  freq: number;
  label: string;
  description: string;
}

export const SOLFEGGIO_TONES: SolfeggioTone[] = [
  { id: '174', name: '174 Hz', freq: 174, label: 'Sollievo & Sicurezza', description: 'Rilascio tensioni fisiche e radicamento profondo' },
  { id: '285', name: '285 Hz', freq: 285, label: 'Rigenerazione Quantica', description: 'Rinnovamento cellulare e rigenerazione dell\'aura' },
  { id: '396', name: '396 Hz', freq: 396, label: 'Liberazione & Pace', description: 'Dissolve ansia, sensi di colpa e blocchi emotivi' },
  { id: '432', name: '432 Hz', freq: 432, label: 'Armonia Universale', description: 'Accordo aureo della natura, battito primordiale' },
  { id: '528', name: '528 Hz', freq: 528, label: 'Frequenza dei Miracoli', description: 'Riparazione del DNA, chiarezza mentale e amore' },
  { id: '639', name: '639 Hz', freq: 639, label: 'Connessione & Cuore', description: 'Armonia relazionale e apertura empatico-spirituale' },
  { id: '852', name: '852 Hz', freq: 852, label: 'Intuizione & Spirito', description: 'Risveglio del terzo occhio e ordine superiore' },
  { id: '963', name: '963 Hz', freq: 963, label: 'Coscienza Cosmica', description: 'Attivazione ghiandola pineale e unione cosmica' },
];

export interface BinauralPreset {
  id: string;
  name: string;
  band: 'Delta' | 'Theta' | 'Alpha';
  beatFreq: number; // Hz difference between ears
  carrier: number;  // Base frequency (Hz)
  description: string;
}

export const BINAURAL_PRESETS: BinauralPreset[] = [
  { id: 'delta-deep', name: 'Delta Sonno Profondo (1.5 Hz)', band: 'Delta', beatFreq: 1.5, carrier: 136.1, description: 'Sonno REM ristoratore, rigenerazione e rilascio ormoni' },
  { id: 'delta-sleep', name: 'Delta Rigenerativo (2.5 Hz)', band: 'Delta', beatFreq: 2.5, carrier: 144.0, description: 'Tranquillità totale, abbassamento battito e calma' },
  { id: 'theta-meditation', name: 'Theta Meditazione (5.5 Hz)', band: 'Theta', beatFreq: 5.5, carrier: 136.1, description: 'Meditazione sciamanica profonda, sogni lucidi e intuizione' },
  { id: 'theta-zen', name: 'Theta Rilassamento (7.0 Hz)', band: 'Theta', beatFreq: 7.0, carrier: 216.0, description: 'Rilassamento muscolare e stato di quiete mentale' },
  { id: 'alpha-peace', name: 'Alpha Calma Vigile (10.0 Hz)', band: 'Alpha', beatFreq: 10.0, carrier: 144.0, description: 'Pace mentale, chiarezza interiore e anti-stress' },
];

export class RelaxationEngine {
  private audioCtx: AudioContext | null = null;
  private outputGain: GainNode | null = null;

  // Master Volume
  public masterVolume = 0.7;

  // Active Solfeggio Oscillators Map
  private activeSolfeggio: Map<string, { osc: OscillatorNode; gain: GainNode }> = new Map();
  public activeSolfeggioIds: Set<string> = new Set();
  public solfeggioVolume = 0.5;

  // Binaural Beat Nodes
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralGain: GainNode | null = null;
  public isBinauralActive = false;
  public activeBinauralPresetId = 'delta-deep';
  public binauralVolume = 0.5;

  // Noise Generators
  private brownNoiseNode: AudioBufferSourceNode | null = null;
  private brownNoiseGain: GainNode | null = null;
  public isBrownNoiseActive = false;
  public brownNoiseVolume = 0.45;

  private pinkNoiseNode: AudioBufferSourceNode | null = null;
  private pinkNoiseGain: GainNode | null = null;
  public isPinkNoiseActive = false;
  public pinkNoiseVolume = 0.4;

  // Tibetan Singing Bowl & Drone
  private droneOscs: OscillatorNode[] = [];
  private droneLfo: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  public isDroneActive = false;
  public droneVolume = 0.5;

  // Sleep Timer
  public sleepTimerDurationMin = 0; // 0 = OFF, 15, 30, 45, 60
  public sleepTimerRemainingSec = 0;
  private sleepTimerInterval: number | null = null;
  private sleepTimerStartTimestamp = 0;
  private sleepTimerInitialSec = 0;
  public onTimerTick: ((remainingSec: number) => void) | null = null;
  public onTimerComplete: (() => void) | null = null;

  private initContext() {
    if (this.audioCtx) return;
    try {
      this.audioCtx = globalPiano.getContext();
      if (!this.audioCtx) {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtxClass();
      }

      this.outputGain = this.audioCtx.createGain();
      this.outputGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);

      const limiter = globalPiano.getAudioDestinationNode();
      if (limiter && limiter.context === this.audioCtx) {
        this.outputGain.connect(limiter);
      } else {
        this.outputGain.connect(this.audioCtx.destination);
      }
    } catch (e) {
      console.warn("RelaxationEngine: AudioContext initialization deferred", e);
    }
  }

  public async resume() {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  // --- SOLFEGGIO FREQUENCIES ---
  public toggleSolfeggio(id: string) {
    if (this.activeSolfeggioIds.has(id)) {
      this.stopSolfeggio(id);
    } else {
      this.startSolfeggio(id);
    }
  }

  public startSolfeggio(id: string) {
    this.resume();
    if (!this.audioCtx || !this.outputGain) return;

    const tone = SOLFEGGIO_TONES.find(t => t.id === id);
    if (!tone) return;

    if (this.activeSolfeggio.has(id)) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(tone.freq, now);

    // Smooth fade in
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(this.solfeggioVolume * 0.4, now + 1.2);

    osc.connect(gain);
    gain.connect(this.outputGain);

    osc.start(now);
    this.activeSolfeggio.set(id, { osc, gain });
    this.activeSolfeggioIds.add(id);
  }

  public stopSolfeggio(id: string) {
    const item = this.activeSolfeggio.get(id);
    if (!item || !this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    item.gain.gain.setValueAtTime(item.gain.gain.value, now);
    item.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

    setTimeout(() => {
      try {
        item.osc.stop();
        item.osc.disconnect();
        item.gain.disconnect();
      } catch (_) {}
    }, 850);

    this.activeSolfeggio.delete(id);
    this.activeSolfeggioIds.delete(id);
  }

  public setSolfeggioVolume(vol: number) {
    this.solfeggioVolume = vol;
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    for (const { gain } of this.activeSolfeggio.values()) {
      gain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.1);
    }
  }

  // --- BINAURAL BEATS ---
  public toggleBinaural(presetId?: string) {
    if (this.isBinauralActive && (!presetId || presetId === this.activeBinauralPresetId)) {
      this.stopBinaural();
    } else {
      if (presetId) this.activeBinauralPresetId = presetId;
      this.startBinaural();
    }
  }

  public startBinaural() {
    this.resume();
    if (!this.audioCtx || !this.outputGain) return;

    this.stopBinaural(false);

    const preset = BINAURAL_PRESETS.find(p => p.id === this.activeBinauralPresetId) || BINAURAL_PRESETS[0];
    const carrier = preset.carrier;
    const diff = preset.beatFreq;

    const leftFreq = carrier - (diff / 2);
    const rightFreq = carrier + (diff / 2);

    const now = this.audioCtx.currentTime;

    const leftOsc = this.audioCtx.createOscillator();
    const rightOsc = this.audioCtx.createOscillator();
    leftOsc.type = 'sine';
    rightOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(leftFreq, now);
    rightOsc.frequency.setValueAtTime(rightFreq, now);

    // Stereo Split
    const merger = this.audioCtx.createChannelMerger(2);
    const pannerLeft = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;
    const pannerRight = this.audioCtx.createStereoPanner ? this.audioCtx.createStereoPanner() : null;

    const bGain = this.audioCtx.createGain();
    bGain.gain.setValueAtTime(0.0001, now);
    bGain.gain.exponentialRampToValueAtTime(this.binauralVolume * 0.5, now + 1.5);

    if (pannerLeft && pannerRight) {
      pannerLeft.pan.setValueAtTime(-1.0, now);
      pannerRight.pan.setValueAtTime(1.0, now);
      leftOsc.connect(pannerLeft);
      rightOsc.connect(pannerRight);
      pannerLeft.connect(bGain);
      pannerRight.connect(bGain);
    } else {
      leftOsc.connect(merger, 0, 0);
      rightOsc.connect(merger, 0, 1);
      merger.connect(bGain);
    }

    bGain.connect(this.outputGain);

    leftOsc.start(now);
    rightOsc.start(now);

    this.binauralLeftOsc = leftOsc;
    this.binauralRightOsc = rightOsc;
    this.binauralGain = bGain;
    this.isBinauralActive = true;
  }

  public stopBinaural(ramp = true) {
    if (!this.isBinauralActive) return;
    if (this.binauralGain && this.audioCtx && ramp) {
      const now = this.audioCtx.currentTime;
      this.binauralGain.gain.setValueAtTime(this.binauralGain.gain.value, now);
      this.binauralGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      const l = this.binauralLeftOsc;
      const r = this.binauralRightOsc;
      const g = this.binauralGain;
      setTimeout(() => {
        try {
          l?.stop();
          l?.disconnect();
          r?.stop();
          r?.disconnect();
          g?.disconnect();
        } catch (_) {}
      }, 650);
    } else {
      try {
        this.binauralLeftOsc?.stop();
        this.binauralLeftOsc?.disconnect();
        this.binauralRightOsc?.stop();
        this.binauralRightOsc?.disconnect();
        this.binauralGain?.disconnect();
      } catch (_) {}
    }
    this.binauralLeftOsc = null;
    this.binauralRightOsc = null;
    this.binauralGain = null;
    this.isBinauralActive = false;
  }

  public setBinauralVolume(vol: number) {
    this.binauralVolume = vol;
    if (this.binauralGain && this.audioCtx) {
      this.binauralGain.gain.linearRampToValueAtTime(vol * 0.5, this.audioCtx.currentTime + 0.1);
    }
  }

  // --- PROCEDURAL BROWN & PINK NOISE ---
  private createBrownNoiseBuffer(): AudioBuffer | null {
    if (!this.audioCtx) return null;
    const bufferSize = this.audioCtx.sampleRate * 5; // 5 seconds seamless loop
    const buffer = this.audioCtx.createBuffer(2, bufferSize, this.audioCtx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + (0.025 * white)) / 1.025;
        data[i] = lastOut * 3.5;
      }
    }
    return buffer;
  }

  private createPinkNoiseBuffer(): AudioBuffer | null {
    if (!this.audioCtx) return null;
    const bufferSize = this.audioCtx.sampleRate * 5;
    const buffer = this.audioCtx.createBuffer(2, bufferSize, this.audioCtx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  public toggleBrownNoise() {
    if (this.isBrownNoiseActive) {
      this.stopBrownNoise();
    } else {
      this.startBrownNoise();
    }
  }

  public startBrownNoise() {
    this.resume();
    if (!this.audioCtx || !this.outputGain) return;

    this.stopBrownNoise(false);

    const buffer = this.createBrownNoiseBuffer();
    if (!buffer) return;

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, this.audioCtx.currentTime);

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(this.brownNoiseVolume * 0.6, this.audioCtx.currentTime + 1.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.outputGain);

    source.start();
    this.brownNoiseNode = source;
    this.brownNoiseGain = gain;
    this.isBrownNoiseActive = true;
  }

  public stopBrownNoise(ramp = true) {
    if (!this.isBrownNoiseActive) return;
    if (this.brownNoiseGain && this.audioCtx && ramp) {
      const now = this.audioCtx.currentTime;
      this.brownNoiseGain.gain.setValueAtTime(this.brownNoiseGain.gain.value, now);
      this.brownNoiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      const node = this.brownNoiseNode;
      const g = this.brownNoiseGain;
      setTimeout(() => {
        try {
          node?.stop();
          node?.disconnect();
          g?.disconnect();
        } catch (_) {}
      }, 650);
    } else {
      try {
        this.brownNoiseNode?.stop();
        this.brownNoiseNode?.disconnect();
        this.brownNoiseGain?.disconnect();
      } catch (_) {}
    }
    this.brownNoiseNode = null;
    this.brownNoiseGain = null;
    this.isBrownNoiseActive = false;
  }

  public setBrownNoiseVolume(vol: number) {
    this.brownNoiseVolume = vol;
    if (this.brownNoiseGain && this.audioCtx) {
      this.brownNoiseGain.gain.linearRampToValueAtTime(vol * 0.6, this.audioCtx.currentTime + 0.1);
    }
  }

  public togglePinkNoise() {
    if (this.isPinkNoiseActive) {
      this.stopPinkNoise();
    } else {
      this.startPinkNoise();
    }
  }

  public startPinkNoise() {
    this.resume();
    if (!this.audioCtx || !this.outputGain) return;

    this.stopPinkNoise(false);

    const buffer = this.createPinkNoiseBuffer();
    if (!buffer) return;

    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(this.pinkNoiseVolume * 0.5, this.audioCtx.currentTime + 1.5);

    source.connect(gain);
    gain.connect(this.outputGain);

    source.start();
    this.pinkNoiseNode = source;
    this.pinkNoiseGain = gain;
    this.isPinkNoiseActive = true;
  }

  public stopPinkNoise(ramp = true) {
    if (!this.isPinkNoiseActive) return;
    if (this.pinkNoiseGain && this.audioCtx && ramp) {
      const now = this.audioCtx.currentTime;
      this.pinkNoiseGain.gain.setValueAtTime(this.pinkNoiseGain.gain.value, now);
      this.pinkNoiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      const node = this.pinkNoiseNode;
      const g = this.pinkNoiseGain;
      setTimeout(() => {
        try {
          node?.stop();
          node?.disconnect();
          g?.disconnect();
        } catch (_) {}
      }, 650);
    } else {
      try {
        this.pinkNoiseNode?.stop();
        this.pinkNoiseNode?.disconnect();
        this.pinkNoiseGain?.disconnect();
      } catch (_) {}
    }
    this.pinkNoiseNode = null;
    this.pinkNoiseGain = null;
    this.isPinkNoiseActive = false;
  }

  public setPinkNoiseVolume(vol: number) {
    this.pinkNoiseVolume = vol;
    if (this.pinkNoiseGain && this.audioCtx) {
      this.pinkNoiseGain.gain.linearRampToValueAtTime(vol * 0.5, this.audioCtx.currentTime + 0.1);
    }
  }

  // --- TIBETAN SINGING BOWL & COSMIC DRONE ---
  public toggleDrone() {
    if (this.isDroneActive) {
      this.stopDrone();
    } else {
      this.startDrone();
    }
  }

  public startDrone() {
    this.resume();
    if (!this.audioCtx || !this.outputGain) return;

    this.stopDrone(false);

    const now = this.audioCtx.currentTime;
    const baseFreq = 108.0;
    const partials = [
      { ratio: 1.0, gain: 0.5, type: 'sine' as OscillatorType },
      { ratio: 2.76, gain: 0.25, type: 'sine' as OscillatorType },
      { ratio: 5.40, gain: 0.12, type: 'sine' as OscillatorType },
      { ratio: 0.5, gain: 0.35, type: 'triangle' as OscillatorType }
    ];

    const masterDroneGain = this.audioCtx.createGain();
    masterDroneGain.gain.setValueAtTime(0.0001, now);
    masterDroneGain.gain.exponentialRampToValueAtTime(this.droneVolume * 0.5, now + 2.0);

    const lfo = this.audioCtx.createOscillator();
    lfo.frequency.setValueAtTime(0.08, now);
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.15, now);
    lfo.connect(lfoGain);

    const oscList: OscillatorNode[] = [];

    partials.forEach(p => {
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const pGain = this.audioCtx.createGain();
      osc.type = p.type;
      osc.frequency.setValueAtTime(baseFreq * p.ratio, now);
      pGain.gain.setValueAtTime(p.gain, now);

      lfoGain.connect(pGain.gain);
      osc.connect(pGain);
      pGain.connect(masterDroneGain);
      osc.start(now);
      oscList.push(osc);
    });

    lfo.start(now);
    masterDroneGain.connect(this.outputGain);

    this.droneOscs = oscList;
    this.droneLfo = lfo;
    this.droneGain = masterDroneGain;
    this.isDroneActive = true;
  }

  public stopDrone(ramp = true) {
    if (!this.isDroneActive) return;
    if (this.droneGain && this.audioCtx && ramp) {
      const now = this.audioCtx.currentTime;
      this.droneGain.gain.setValueAtTime(this.droneGain.gain.value, now);
      this.droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      const oscs = [...this.droneOscs];
      const lfo = this.droneLfo;
      const g = this.droneGain;
      setTimeout(() => {
        try {
          oscs.forEach(o => { o.stop(); o.disconnect(); });
          lfo?.stop();
          lfo?.disconnect();
          g?.disconnect();
        } catch (_) {}
      }, 1050);
    } else {
      try {
        this.droneOscs.forEach(o => { o.stop(); o.disconnect(); });
        this.droneLfo?.stop();
        this.droneLfo?.disconnect();
        this.droneGain?.disconnect();
      } catch (_) {}
    }
    this.droneOscs = [];
    this.droneLfo = null;
    this.droneGain = null;
    this.isDroneActive = false;
  }

  public setDroneVolume(vol: number) {
    this.droneVolume = vol;
    if (this.droneGain && this.audioCtx) {
      this.droneGain.gain.linearRampToValueAtTime(vol * 0.5, this.audioCtx.currentTime + 0.1);
    }
  }

  // --- SLEEP TIMER ---
  public setSleepTimer(minutes: number) {
    if (this.sleepTimerInterval !== null) {
      window.clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }

    this.sleepTimerDurationMin = minutes;
    if (minutes <= 0) {
      this.sleepTimerRemainingSec = 0;
      if (this.onTimerTick) this.onTimerTick(0);
      if (this.outputGain && this.audioCtx) {
        this.outputGain.gain.linearRampToValueAtTime(this.masterVolume, this.audioCtx.currentTime + 0.5);
      }
      return;
    }

    const totalSeconds = minutes * 60;
    this.sleepTimerInitialSec = totalSeconds;
    this.sleepTimerRemainingSec = totalSeconds;
    this.sleepTimerStartTimestamp = Date.now();

    if (this.onTimerTick) this.onTimerTick(this.sleepTimerRemainingSec);

    this.sleepTimerInterval = window.setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - this.sleepTimerStartTimestamp) / 1000);
      const rem = Math.max(0, this.sleepTimerInitialSec - elapsedSec);
      this.sleepTimerRemainingSec = rem;

      if (this.onTimerTick) this.onTimerTick(rem);

      const fadeWindowSec = Math.min(180, Math.floor(this.sleepTimerInitialSec * 0.25));
      if (rem <= fadeWindowSec && this.outputGain && this.audioCtx) {
        const factor = rem / fadeWindowSec;
        const currentTargetVol = Math.max(0.0001, this.masterVolume * factor);
        this.outputGain.gain.linearRampToValueAtTime(currentTargetVol, this.audioCtx.currentTime + 0.8);
      }

      if (rem <= 0) {
        this.stopAllRelaxation();
        if (this.sleepTimerInterval !== null) {
          window.clearInterval(this.sleepTimerInterval);
          this.sleepTimerInterval = null;
        }
        this.sleepTimerDurationMin = 0;
        if (this.onTimerComplete) this.onTimerComplete();
      }
    }, 1000);
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = vol;
    if (this.outputGain && this.audioCtx) {
      this.outputGain.gain.linearRampToValueAtTime(vol, this.audioCtx.currentTime + 0.1);
    }
  }

  public stopAllRelaxation() {
    for (const id of Array.from(this.activeSolfeggioIds)) {
      this.stopSolfeggio(id);
    }
    this.stopBinaural(true);
    this.stopBrownNoise(true);
    this.stopPinkNoise(true);
    this.stopDrone(true);
  }

  public isAnySoundActive(): boolean {
    return (
      this.activeSolfeggioIds.size > 0 ||
      this.isBinauralActive ||
      this.isBrownNoiseActive ||
      this.isPinkNoiseActive ||
      this.isDroneActive
    );
  }

  public dispose() {
    this.stopAllRelaxation();
    if (this.sleepTimerInterval !== null) {
      window.clearInterval(this.sleepTimerInterval);
      this.sleepTimerInterval = null;
    }
  }
}

export const globalRelaxation = new RelaxationEngine();
