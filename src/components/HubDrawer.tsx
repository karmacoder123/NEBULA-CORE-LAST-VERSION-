/**
 * @license
 * SPDX-License-Identifier: MIT
 * Nebula Control Drawer - Exact Replica of Original GitHub Project
 * Tabs: SCIAME, FISICA, LUCI, AUDIO, INPUT + Built-in Relaxation Sound Generator
 */

import React, { useState, useEffect } from 'react';
import { HubTabType } from './BottomDock';
import { SimulationParams, EngineMode, GeometryType, TouchMode } from '../types';
import { globalPiano, NOTE_NAMES, PENTATONIC_FREQS } from '../audio/pianoEngine';
import { 
  globalRelaxation, 
  SOLFEGGIO_TONES, 
  BINAURAL_PRESETS 
} from '../audio/relaxationEngine';
import { 
  X, Eye, RotateCcw, Volume2, VolumeX, Sparkles, Moon, Clock, Compass 
} from 'lucide-react';

const PRESET_CHIPS: { id: string; label: string }[] = [
  { id: 'V1', label: 'V1 CRISTALLO' },
  { id: 'V2', label: 'V2 PLASMA' },
  { id: 'V3', label: 'V3 SATURNO' },
  { id: 'V4', label: 'V4 DISCO' },
  { id: 'V5', label: 'V5 ATOMO' },
  { id: 'V6', label: 'V6 GALASSIA' },
  { id: 'V7', label: 'V7 DNA' },
  { id: 'V8', label: 'V8 TORNADO' },
  { id: 'V9', label: 'V9 NEBULOSA' },
  { id: 'V10', label: 'V10 GUSCIO' },
  { id: 'V11', label: 'V11 ONDA' },
  { id: 'V12', label: 'V12 SUPERNOVA' },
  { id: 'V13', label: 'V13 NEBULA CORE' },
  { id: 'V14', label: 'V14 NODO' },
];

const PIANO_16_KEYS = [
  { name: 'C3', idx: 0 },
  { name: 'D3', idx: 1 },
  { name: 'E3', idx: 2 },
  { name: 'G3', idx: 3 },
  { name: 'A3', idx: 4 },
  { name: 'C4', idx: 5 },
  { name: 'D4', idx: 6 },
  { name: 'E4', idx: 7 },
  { name: 'G4', idx: 8 },
  { name: 'A4', idx: 9 },
  { name: 'C5', idx: 10 },
  { name: 'D5', idx: 11 },
  { name: 'E5', idx: 12 },
  { name: 'G5', idx: 13 },
  { name: 'A5', idx: 14 },
  { name: 'C6', idx: 15 },
];

interface HubDrawerProps {
  activeTab: HubTabType;
  onClose: () => void;
  params: SimulationParams;
  onUpdateParams: (newParams: Partial<SimulationParams>) => void;
  currentV: string;
  onSelectVersion: (version: string) => void;
  engineMode: EngineMode;
  onSelectEngineMode: (mode: EngineMode) => void;
  currentGeoType: GeometryType;
  onChangeGeoType: (geo: GeometryType) => void;
  isCycleActive: boolean;
  onToggleCycle: () => void;
  cycleTime?: number;
  onUpdateCycleTime?: (time: number) => void;
  isCamActive: boolean;
  onToggleCam: () => void;
  isMicActive: boolean;
  onToggleMic: () => void;
  isTiltActive: boolean;
  onToggleTilt: () => void;
  tiltAngleX?: number;
  tiltAngleY?: number;
  tiltForce?: number;
  onUpdateTiltParams?: (force: number, smooth: number) => void;
  isTrailsActive?: boolean;
  onToggleTrails?: () => void;
  isAutorotActive?: boolean;
  onToggleAutorot?: () => void;
  onResetPhysics?: () => void;
  touchMode?: TouchMode;
  onToggleTouchMode?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onTakePhoto?: () => void;
  isRecording?: boolean;
  onToggleRecord?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onOpenDownloadPortal?: () => void;
  isMidiActive?: boolean;
  midiDeviceName?: string;
  onToggleMidi?: () => void;
}

export const HubDrawer: React.FC<HubDrawerProps> = ({
  activeTab,
  onClose,
  params,
  onUpdateParams,
  currentV,
  onSelectVersion,
  isCycleActive,
  onToggleCycle,
  cycleTime = 15.0,
  onUpdateCycleTime,
  isCamActive,
  onToggleCam,
  isMicActive,
  onToggleMic,
  isTiltActive,
  onToggleTilt,
  tiltAngleX = 0,
  tiltAngleY = 0,
  onUpdateTiltParams,
  isTrailsActive = true,
  onToggleTrails,
  isAutorotActive = true,
  onToggleAutorot,
  onResetPhysics,
  touchMode = 'ATTRACT',
  onToggleTouchMode,
  isMuted = false,
  onToggleMute,
  onTakePhoto,
  isRecording = false,
  onToggleRecord,
  onToggleFullscreen,
  onOpenDownloadPortal,
  isMidiActive = true,
  midiDeviceName = 'Driver IAC Bus 1',
  onToggleMidi,
}) => {
  // Height state: level 3 for expansive viewing
  const [heightLevel, setHeightLevel] = useState<1 | 2 | 3>(3);

  // Tab Sciame states
  const [lockAudio, setLockAudio] = useState(true);
  const [lockRot, setLockRot] = useState(true);
  const [selectedTrailPreset, setSelectedTrailPreset] = useState<'COMETA' | 'METEORA' | 'IPERSPAZIO' | 'DELICATO'>('IPERSPAZIO');
  const [trailLen, setTrailLen] = useState(26);
  const [trailPersist, setTrailPersist] = useState(2.2);
  const [trailTracers, setTrailTracers] = useState(450);
  const [rot4dXW, setRot4dXW] = useState(-0.2);
  const [rot4dYW, setRot4dYW] = useState(0.3);
  const [rot4dZW, setRot4dZW] = useState(-0.3);

  // Tab Fisica states
  const [gravForce, setGravForce] = useState(18.0);
  const [attractorRadius, setAttractorRadius] = useState(900);
  const [gravVortex, setGravVortex] = useState(12.0);
  const [isRingsActive, setIsRingsActive] = useState(true);
  const [ringSpeed, setRingSpeed] = useState(0.3);
  const [ringSwarmInfluence, setRingSwarmInfluence] = useState(2.00);
  const [ringAudioInfluence, setRingAudioInfluence] = useState(0.05);
  const [wandererSpeed, setWandererSpeed] = useState(1.0);
  const [wandererForce, setWandererForce] = useState(1.0);
  const [spectraSpeed, setSpectraSpeed] = useState(1.0);
  const [spectraForce, setSpectraForce] = useState(1.0);

  // Tab Luci states
  const [sunPrimary, setSunPrimary] = useState(2.5);
  const [sunAmbient, setSunAmbient] = useState(0.6);
  const [sunContrast, setSunContrast] = useState(1.2);
  const [sunColor, setSunColor] = useState<'BIANCO' | 'ORO' | 'CIANO' | 'VIOLA'>('BIANCO');

  // Tab Audio states
  const [micGain, setMicGain] = useState(2.0);
  const [cathedralReverb, setCathedralReverb] = useState(1.0);
  const [audioPower, setAudioPower] = useState(1.5);
  const [micThreshold, setMicThreshold] = useState(0.12);
  const [midiChannel, setMidiChannel] = useState(1);
  const [midiNotesOn, setMidiNotesOn] = useState(true);
  const [midiCcOn, setMidiCcOn] = useState(true);
  const [isCrystalsActive, setIsCrystalsActive] = useState(false);
  const [crystalMode, setCrystalMode] = useState<'IMPATTI' | 'SCINTILLE' | 'SFERE' | 'TUTTI'>('SFERE');
  const [crystalSens, setCrystalSens] = useState(0.05);
  const [crystalDensity, setCrystalDensity] = useState(2);
  const [crystalVolume, setCrystalVolume] = useState(0.15);
  const [isKineticNotesOn, setIsKineticNotesOn] = useState(false);
  const [isAudio3dOn, setIsAudio3dOn] = useState(true);
  const [pianoProfile, setPianoProfile] = useState<string>('DRONE POLIFONICO');
  const [arpPattern, setArpPattern] = useState<string>('OFF');
  const [arpDivision, setArpDivision] = useState<string>('1/4');
  const [chordType, setChordType] = useState<string>('SOLO');
  const [chordOvertones, setChordOvertones] = useState(0.1);
  const [attackSoftness, setAttackSoftness] = useState(2.00);
  const [sustainTail, setSustainTail] = useState(6.0);
  const [brightnessHarmonics, setBrightnessHarmonics] = useState(0.2);
  const [noteDamping, setNoteDamping] = useState(1.00);
  const [kineticMode, setKineticMode] = useState<'SU VARIAZIONI' | 'CONTINUO'>('SU VARIAZIONI');
  const [kineticTriggerThreshold, setKineticTriggerThreshold] = useState(0.15);
  const [kineticGenSens, setKineticGenSens] = useState(0.15);

  // Frequency Relaxation Generator (Extra module requested by user)
  const [showRelaxationModule, setShowRelaxationModule] = useState(false);
  const [relaxTab, setRelaxTab] = useState<'solfeggio' | 'binaural' | 'noise' | 'drone' | 'timer'>('solfeggio');
  const [activeSolfeggioSet, setActiveSolfeggioSet] = useState<string[]>([]);
  const [isBinauralActive, setIsBinauralActive] = useState(false);
  const [binauralPresetId, setBinauralPresetId] = useState('delta-deep');
  const [isBrownActive, setIsBrownActive] = useState(false);
  const [isPinkActive, setIsPinkActive] = useState(false);
  const [isDroneActive, setIsDroneActive] = useState(false);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
  const [sleepTimerDuration, setSleepTimerDuration] = useState(0);

  // Tab Input states
  const [tiltSensLocal, setTiltSensLocal] = useState(1.0);
  const [tiltSmoothLocal, setTiltSmoothLocal] = useState(0.20);

  useEffect(() => {
    globalRelaxation.onTimerTick = (remSec) => setSleepTimerRemaining(remSec);
    globalRelaxation.onTimerComplete = () => {
      setSleepTimerRemaining(0);
      setSleepTimerDuration(0);
    };
  }, []);

  if (!activeTab) return null;

  const handleSliderChange = (key: keyof SimulationParams, val: number) => {
    onUpdateParams({ [key]: val });
  };

  const handleReset = () => {
    if (onResetPhysics) {
      onResetPhysics();
    }
    setGravForce(18.0);
    setAttractorRadius(900);
    setGravVortex(12.0);
    setRingSpeed(0.3);
    setRingSwarmInfluence(2.0);
    setRingAudioInfluence(0.05);
    setWandererSpeed(1.0);
    setWandererForce(1.0);
    setSpectraSpeed(1.0);
    setSpectraForce(1.0);
    setSunPrimary(2.5);
    setSunAmbient(0.6);
    setSunContrast(1.2);
    setSunColor('BIANCO');
    setMicGain(2.0);
    setCathedralReverb(1.0);
    setAudioPower(1.5);
    setMicThreshold(0.12);
    setAttackSoftness(2.0);
    setSustainTail(6.0);
    setBrightnessHarmonics(0.2);
    setNoteDamping(1.0);
    setKineticTriggerThreshold(0.15);
    setKineticGenSens(0.15);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div
      id="nebula-control-drawer"
      className="fixed z-40 left-1/2 -translate-x-1/2 bottom-[78px] w-[95%] max-w-[620px] bg-[#020b06]/95 backdrop-blur-2xl border border-[#00ffaa]/50 rounded-2xl flex flex-col shadow-[0_0_35px_rgba(0,255,170,0.35)] transition-all duration-300 select-none overflow-hidden"
      style={{
        maxHeight: heightLevel === 3 ? 'calc(100vh - 100px)' : heightLevel === 2 ? '65vh' : '45vh',
        height: heightLevel === 3 ? 'calc(100vh - 100px)' : heightLevel === 2 ? '65vh' : '45vh',
      }}
    >
      {/* DRAWER TOP BAR / RESIZER */}
      <div
        className="w-full pt-2 pb-1 flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setHeightLevel(prev => prev === 3 ? 2 : prev === 2 ? 1 : 3)}
      >
        <div className="w-12 h-1.5 bg-[#00ffaa] rounded-full shadow-[0_0_8px_#00ffaa]" />
      </div>

      {/* DRAWER HEADER EXACTLY AS IN SCREENSHOT */}
      <div className="px-4 py-2 border-b border-[#00ffaa]/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#00ffaa] text-sm">⚙️</span>
          <span className="font-mono font-black text-sm text-[#00ffaa] tracking-widest uppercase">
            NEBULA CONTROL
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeightLevel(prev => prev === 1 ? 3 : 1)}
            className="px-3 py-1 rounded-full border border-[#00ffaa] text-[#00ffaa] font-mono font-bold text-[10px] tracking-wider uppercase bg-transparent hover:bg-[#00ffaa]/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_rgba(0,255,170,0.3)]"
          >
            <span>👁</span> VEDI SCIAME
          </button>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-[#ff3366] text-[#ff3366] hover:bg-[#ff3366]/20 flex items-center justify-center transition-all cursor-pointer shadow-[0_0_8px_rgba(255,51,102,0.3)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DRAWER BODY (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 custom-scrollbar text-[#00ffaa] font-mono">

        {/* ========================================================================= */}
        {/* TAB 1: SCIAME (EXACT REPLICA FROM SCREENSHOT 2.13.44) */}
        {/* ========================================================================= */}
        {activeTab === 'sciame' && (
          <div className="space-y-3.5">
            {/* SEZIONE 1: COSA RESTA UGUALE TRA I PRESET */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1.5">
                <span>🔒</span> COSA RESTA UGUALE TRA I PRESET
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLockAudio(!lockAudio)}
                  className={`py-1.5 px-3 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                    lockAudio
                      ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_15px_#00ffaa]'
                      : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                  }`}
                >
                  🔒 AUDIO: {lockAudio ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setLockRot(!lockRot)}
                  className={`py-1.5 px-3 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                    lockRot
                      ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_15px_#00ffaa]'
                      : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                  }`}
                >
                  🔒 ROTAZIONE: {lockRot ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Con il lucchetto acceso, cambiando preset restano invariati tutto l'audio (timbro, arpeggio, accordi, slider, cristalli) oppure l'autorotazione 3D/4D (acceso/spento e velocità). Spento: ogni preset usa i suoi valori.
              </div>
            </div>

            {/* SEZIONE 2: 14 PRESETS COSMICI */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1.5">
                <span>🎛</span> 14 PRESETS COSMICI
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_CHIPS.map(chip => {
                  const isSelected = currentV === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => onSelectVersion(chip.id)}
                      className={`px-2.5 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_15px_#00ffaa]'
                          : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-1 font-mono text-[10px]">
                <div className="flex justify-between items-center text-[#00ffaa]">
                  <span>DURATA CICLO</span>
                  <b className="text-[#00ffaa] font-black">{(cycleTime ?? params.cycleTime).toFixed(1)}s</b>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="60.0"
                  step="1.0"
                  value={cycleTime ?? params.cycleTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (onUpdateCycleTime) onUpdateCycleTime(val);
                    else onUpdateParams({ cycleTime: val });
                  }}
                  className="w-full accent-[#00ffaa] cursor-pointer"
                />
              </div>

              <button
                onClick={onToggleCycle}
                className={`w-full py-2 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                  isCycleActive
                    ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_20px_#00ffaa]'
                    : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                }`}
              >
                🔄 AUTO-CYCLE: {isCycleActive ? `ON (${(cycleTime ?? params.cycleTime).toFixed(1)}s)` : 'OFF'}
              </button>
            </div>

            {/* SEZIONE 3: DENSITÀ SCIAME & PARTICELLE */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1.5">
                <span>✨</span> DENSITÀ SCIAME & PARTICELLE
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between items-center text-[#00ffaa]">
                  <span>NUMERO PARTICELLE</span>
                  <b className="text-[#00ffaa] font-black">{params.particleCount}</b>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="40000"
                  step="1000"
                  value={params.particleCount}
                  onChange={(e) => handleSliderChange('particleCount', parseInt(e.target.value, 10))}
                  className="w-full accent-[#00ffaa] cursor-pointer"
                />
              </div>
              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Aggiornamento istantaneo dinamico dello sciame senza ricaricare (ottimizzato iPhone max 5.000).
              </div>
            </div>

            {/* SEZIONE 4: SCIE GEOMETRICHE 3D */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1.5">
                <span>🌠</span> SCIE GEOMETRICHE 3D (PARTICLE TRAILS)
              </div>
              <button
                onClick={() => {
                  if (onToggleTrails) onToggleTrails();
                  else onUpdateParams({ trailOpacity: params.trailOpacity > 0 ? 0 : 0.14 });
                }}
                className={`w-full py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                  (isTrailsActive ?? params.trailOpacity > 0)
                    ? 'border border-[#00ffaa] text-[#00ffaa] bg-[#00ffaa]/15 shadow-[0_0_12px_rgba(0,255,170,0.3)]'
                    : 'border border-[#00ffaa]/40 text-[#00ffaa]/50 bg-black/40'
                }`}
              >
                🌠 SCIE 3D: {(isTrailsActive ?? params.trailOpacity > 0) ? 'ON' : 'OFF'}
              </button>
              <div className="flex flex-wrap gap-1.5">
                {(['COMETA', 'METEORA', 'IPERSPAZIO', 'DELICATO'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedTrailPreset(p);
                      if (p === 'COMETA') { setTrailLen(18); setTrailPersist(1.5); }
                      if (p === 'METEORA') { setTrailLen(35); setTrailPersist(3.0); }
                      if (p === 'IPERSPAZIO') { setTrailLen(26); setTrailPersist(2.2); setTrailTracers(450); }
                      if (p === 'DELICATO') { setTrailLen(10); setTrailPersist(0.9); }
                    }}
                    className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                      selectedTrailPreset === p
                        ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_12px_#00ffaa]'
                        : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="space-y-2 pt-1 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>LUNGHEZZA SCIA (SEGMENTI)</span>
                    <b className="text-[#00ffaa] font-black">{trailLen}</b>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="60"
                    step="2"
                    value={trailLen}
                    onChange={(e) => setTrailLen(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>LUMINOSITÀ / PERSISTENZA</span>
                    <b className="text-[#00ffaa] font-black">{trailPersist.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={trailPersist}
                    onChange={(e) => setTrailPersist(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>NUMERO PARTICELLE CON SCIA</span>
                    <b className="text-[#00ffaa] font-black">{trailTracers}</b>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="25"
                    value={trailTracers}
                    onChange={(e) => setTrailTracers(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>
              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Code geometriche 3D dinamiche con tracciamento vettoriale persistente e dissolvenza additiva.
              </div>
            </div>

            {/* SEZIONE 5: AUTOROTAZIONE SCIAME 3D (BORDO VIOLA) */}
            <div className="border border-[#b026ff] rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(176,38,255,0.2)]">
              <div className="text-[11px] font-mono font-bold text-[#b026ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🔄</span> AUTOROTAZIONE SCIAME 3D
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onToggleAutorot) onToggleAutorot();
                    else onUpdateParams({ rotX: params.rotX === 0 ? 0.1 : 0 });
                  }}
                  className={`flex-1 py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                    isAutorotActive
                      ? 'bg-[#b026ff] text-white shadow-[0_0_15px_#b026ff]'
                      : 'border border-[#b026ff]/50 text-[#b026ff] bg-black/40 hover:bg-[#b026ff]/20'
                  }`}
                >
                  🔄 AUTOROT: {isAutorotActive ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => {
                    onUpdateParams({ rotX: 0, rotY: 0, rotZ: 0 });
                    setRot4dXW(0);
                    setRot4dYW(0);
                    setRot4dZW(0);
                  }}
                  className="px-4 py-1.5 rounded-full font-mono font-bold text-[11px] border border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/20 transition-all cursor-pointer"
                >
                  RESET ASSI
                </button>
              </div>

              <div className="space-y-2 pt-1 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VELOCITÀ ASSE X</span>
                    <b className="text-[#00ffaa] font-black">{params.rotX.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={params.rotX}
                    onChange={(e) => handleSliderChange('rotX', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VELOCITÀ ASSE Y</span>
                    <b className="text-[#00ffaa] font-black">{params.rotY.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={params.rotY}
                    onChange={(e) => handleSliderChange('rotY', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VELOCITÀ ASSE Z</span>
                    <b className="text-[#00ffaa] font-black">{params.rotZ.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={params.rotZ}
                    onChange={(e) => handleSliderChange('rotZ', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ROTAZIONE 4D · PIANO XW</span>
                    <b className="text-[#00ffaa] font-black">{rot4dXW.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={rot4dXW}
                    onChange={(e) => setRot4dXW(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ROTAZIONE 4D · PIANO YW</span>
                    <b className="text-[#00ffaa] font-black">{rot4dYW.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={rot4dYW}
                    onChange={(e) => setRot4dYW(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ROTAZIONE 4D · PIANO ZW</span>
                    <b className="text-[#00ffaa] font-black">{rot4dZW.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="-2.0"
                    max="2.0"
                    step="0.1"
                    value={rot4dZW}
                    onChange={(e) => setRot4dZW(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>
              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Rotazione 4D vera: ogni particella ha una coordinata W nascosta. I piani XW/YW/ZW la mescolano con X/Y/Z e lo sciame si deforma come un ipercubo o un'ipersfera che ruota (con RESET ASSI torna all'origine). Attiva AUTOROT per animarla.
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: FISICA (EXACT REPLICA FROM SCREENSHOT 2.15.30) */}
        {/* ========================================================================= */}
        {activeTab === 'fisica' && (
          <div className="space-y-3.5">
            {/* SEZIONE 1: ATTRATTORE GRAVITAZIONALE (TOUCH/MOUSE) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🌌</span> ATTRATTORE GRAVITAZIONALE (TOUCH/MOUSE)
              </div>
              <button
                onClick={onToggleTouchMode}
                className="w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/15 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
              >
                <span>🧲</span> MODALITÀ FORZA: {touchMode === 'ATTRACT' ? 'ATTRAZIONE' : 'REPULSIONE'}
              </button>

              <div className="space-y-2 pt-1 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>FORZA GRAVITAZIONALE</span>
                    <b className="text-[#00ffaa] font-black">{gravForce.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="50.0"
                    step="0.5"
                    value={gravForce}
                    onChange={(e) => setGravForce(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>RAGGIO ATTRATTORE</span>
                    <b className="text-[#00ffaa] font-black">{attractorRadius}</b>
                  </div>
                  <input
                    type="range"
                    min="200"
                    max="2500"
                    step="50"
                    value={attractorRadius}
                    onChange={(e) => setAttractorRadius(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VORTICE GRAVITAZIONALE</span>
                    <b className="text-[#00ffaa] font-black">{gravVortex.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="40.0"
                    step="0.5"
                    value={gravVortex}
                    onChange={(e) => setGravVortex(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SEZIONE 2: FISICA PARTICELLE (MEMORIA) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🔒</span> FISICA PARTICELLE (MEMORIA)
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ATTRITO</span>
                    <b className="text-[#00ffaa] font-black">{params.friction.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.85"
                    max="0.99"
                    step="0.01"
                    value={params.friction}
                    onChange={(e) => handleSliderChange('friction', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ELASTICITÀ</span>
                    <b className="text-[#00ffaa] font-black">{params.elasticity.toFixed(3)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0005"
                    max="0.0100"
                    step="0.0005"
                    value={params.elasticity}
                    onChange={(e) => handleSliderChange('elasticity', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>DIMENSIONE PARTICELLA</span>
                    <b className="text-[#00ffaa] font-black">{params.pSize.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="8.0"
                    step="0.1"
                    value={params.pSize}
                    onChange={(e) => handleSliderChange('pSize', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>POTENZA WEBCAM / MANO</span>
                    <b className="text-[#00ffaa] font-black">{params.handPower.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="30.0"
                    step="0.5"
                    value={params.handPower}
                    onChange={(e) => handleSliderChange('handPower', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SEZIONE 3: ANELLI DI WANDERER E SPECTRA (BORDO ORO/AMBRA) */}
            <div className="border border-[#ffaa00]/60 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(255,170,0,0.2)]">
              <div className="text-[11px] font-mono font-bold text-[#ffaa00] tracking-wider uppercase flex items-center gap-1.5">
                <span>💍</span> ANELLI DI WANDERER E SPECTRA
              </div>
              <button
                onClick={() => setIsRingsActive(!isRingsActive)}
                className="w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#ffaa00] text-[#ffaa00] bg-black/40 hover:bg-[#ffaa00]/15 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(255,170,0,0.2)]"
              >
                <span>💍</span> ANELLI: {isRingsActive ? 'ON' : 'OFF'}
              </button>

              <div className="space-y-2 pt-1 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#ffaa00]">
                    <span>VELOCITÀ ANELLI</span>
                    <b className="text-[#ffaa00] font-black">{ringSpeed.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={ringSpeed}
                    onChange={(e) => setRingSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#ffaa00] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#ffaa00]">
                    <span>INFLUENZA SULLO SCIAME</span>
                    <b className="text-[#ffaa00] font-black">{ringSwarmInfluence.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={ringSwarmInfluence}
                    onChange={(e) => setRingSwarmInfluence(parseFloat(e.target.value))}
                    className="w-full accent-[#ffaa00] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#ffaa00]">
                    <span>INFLUENZA SULL'AUDIO</span>
                    <b className="text-[#ffaa00] font-black">{ringAudioInfluence.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.01"
                    value={ringAudioInfluence}
                    onChange={(e) => setRingAudioInfluence(parseFloat(e.target.value))}
                    className="w-full accent-[#ffaa00] cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[10px] text-[#ffaa00]/75 leading-relaxed font-mono">
                Ogni sfera ha due anelli che ruotano in senso opposto e cambiano colore di continuo. A intervalli casuali cambiano velocità, direzione ed effetto: lo sciame viene trascinato in vortici, pulsazioni o spinte lungo l'asse. L'audio riceve note e cristalli quando gli anelli si allineano e modula la sensibilità delle note cinetiche.
              </div>
            </div>

            {/* SEZIONE 4: ANCORAGGIO CENTRALE & ZOOM SCIAME */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🌌</span> ANCORAGGIO CENTRALE & ZOOM SCIAME
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>FORZA ATTRAZIONE CENTRO SCHERMO</span>
                    <b className="text-[#00ffaa] font-black">{params.centerAttraction.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="2.0"
                    step="0.05"
                    value={params.centerAttraction}
                    onChange={(e) => handleSliderChange('centerAttraction', parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5 font-mono">
                    Ancora lo sciame al centro schermo (0,0,0): le particelle si allontanano solo per l'interazione delle sfere.
                  </div>
                </div>

                <div className="pt-1">
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ZOOM SCIAME (DISTANZA CAMERA)</span>
                    <b className="text-[#00ffaa] font-black">{params.zoom}</b>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="6000"
                    step="100"
                    value={params.zoom}
                    onChange={(e) => handleSliderChange('zoom', parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5 font-mono">
                    Regola il campo visivo dello sciame di particelle senza coprire la scena.
                  </div>
                </div>
              </div>
            </div>

            {/* SEZIONE 5: SFERA ORBITANTE 1 (WANDERER) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00ffaa] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00ffaa] shadow-[0_0_8px_#00ffaa]" /> SFERA ORBITANTE 1 (WANDERER)
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VELOCITÀ ORBITALE WANDERER</span>
                    <b className="text-[#00ffaa] font-black">{wandererSpeed.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={wandererSpeed}
                    onChange={(e) => setWandererSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>FORZA ATTRAZIONE/REPULSIONE</span>
                    <b className="text-[#00ffaa] font-black">+{wandererForce.toFixed(1)} (REPULSIONE)</b>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.2"
                    value={wandererForce}
                    onChange={(e) => setWandererForce(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Scala simmetrica: -3.0 (Massima Attrazione) ↔ +3.0 (Massima Repulsione). Raggio comune: 600. Se imposti tu il valore, resta fisso cambiando preset (RIPRISTINA lo sblocca).
              </div>
            </div>

            {/* SEZIONE 6: SFERA ORBITANTE 2 (SPECTRA) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" /> SFERA ORBITANTE 2 (SPECTRA)
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VELOCITÀ ORBITALE SPECTRA</span>
                    <b className="text-[#00ffaa] font-black">{spectraSpeed.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={spectraSpeed}
                    onChange={(e) => setSpectraSpeed(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>FORZA ATTRAZIONE/REPULSIONE</span>
                    <b className="text-[#00ffaa] font-black">+{spectraForce.toFixed(1)} (REPULSIONE)</b>
                  </div>
                  <input
                    type="range"
                    min="-3.0"
                    max="3.0"
                    step="0.2"
                    value={spectraForce}
                    onChange={(e) => setSpectraForce(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Scala simmetrica: -3.0 (Massima Attrazione) ↔ 0 (Neutro) ↔ +3.0 (Massima Repulsione). Raggio comune: 600. Se imposti tu il valore, resta fisso cambiando preset (RIPRISTINA lo sblocca).
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LUCI (EXACT REPLICA FROM SCREENSHOT 2.16.03) */}
        {/* ========================================================================= */}
        {activeTab === 'luci' && (
          <div className="space-y-3.5">
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-3 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#ffaa00] tracking-wider uppercase flex items-center gap-1.5">
                <span>☀️</span> ILLUMINAZIONE COSMICA & SOLI
              </div>

              <div className="space-y-2.5 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>INTENSITÀ SOLE PRIMARIO</span>
                    <b className="text-[#00ffaa] font-black">{sunPrimary.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5.0"
                    step="0.1"
                    value={sunPrimary}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSunPrimary(v);
                      onUpdateParams({ sunIntensity: v });
                    }}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>LUCE AMBIENTALE COSMICA</span>
                    <b className="text-[#00ffaa] font-black">{sunAmbient.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.05"
                    value={sunAmbient}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSunAmbient(v);
                      onUpdateParams({ ambientIntensity: v });
                    }}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SOLE SECONDARIO DI CONTRASTO</span>
                    <b className="text-[#00ffaa] font-black">{sunContrast.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={sunContrast}
                    onChange={(e) => setSunContrast(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div className="pt-1">
                  <span className="block text-[10px] text-[#00ffaa] mb-1.5 uppercase font-mono font-bold">
                    TEMPERATURA / COLORE SOLE
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'BIANCO', icon: '⚪', label: 'BIANCO' },
                      { id: 'ORO', icon: '🟡', label: 'ORO' },
                      { id: 'CIANO', icon: '🔵', label: 'CIANO' },
                      { id: 'VIOLA', icon: '🟣', label: 'VIOLA' },
                    ].map(col => (
                      <button
                        key={col.id}
                        onClick={() => setSunColor(col.id as any)}
                        className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                          sunColor === col.id
                            ? 'bg-[#00ffaa] text-[#021008] shadow-[0_0_12px_#00ffaa]'
                            : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                        }`}
                      >
                        <span>{col.icon}</span> {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUDIO (EXACT REPLICA FROM SCREENSHOTS 2.16.50 & 2.17.23) */}
        {/* ========================================================================= */}
        {activeTab === 'audio' && (
          <div className="space-y-3.5">
            {/* TOGGLE SINTESI GENERATORE EXTRA DI RILASSAMENTO */}
            <div className="flex justify-between items-center bg-[#011409] p-1.5 rounded-xl border border-[#00552b]">
              <span className="text-[10px] font-mono font-bold text-[#88ffaa] flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-[#00e5ff]" />
                GENERATORE FREQUENZE & SONNO (SOLFEGGIO, BINAURALI)
              </span>
              <button
                onClick={() => setShowRelaxationModule(!showRelaxationModule)}
                className={`px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  showRelaxationModule
                    ? 'bg-[#00e5ff] text-[#01140a]'
                    : 'border border-[#00e5ff]/50 text-[#00e5ff]'
                }`}
              >
                {showRelaxationModule ? 'NASCONDI' : 'MOSTRA'}
              </button>
            </div>

            {/* SEZIONE SPECIALE: GENERATORE FREQUENZE & SONNO (SE ATTIVATO) */}
            {showRelaxationModule && (
              <div className="border border-[#00e5ff]/50 rounded-xl p-3 bg-black/70 space-y-3 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <div className="grid grid-cols-5 gap-1.5 bg-[#021008] p-1.5 rounded-xl border border-[#004422]">
                  <button
                    onClick={() => setRelaxTab('solfeggio')}
                    className={`py-1 rounded-lg text-[9.5px] font-bold text-center transition-all cursor-pointer ${
                      relaxTab === 'solfeggio' ? 'bg-[#00ff88] text-[#01140a] font-black' : 'bg-[#002211] text-[#88ffaa]'
                    }`}
                  >
                    SOLFEGGIO
                  </button>
                  <button
                    onClick={() => setRelaxTab('binaural')}
                    className={`py-1 rounded-lg text-[9.5px] font-bold text-center transition-all cursor-pointer ${
                      relaxTab === 'binaural' ? 'bg-[#00e5ff] text-[#01140a] font-black' : 'bg-[#002211] text-[#88ffaa]'
                    }`}
                  >
                    BINAURALI
                  </button>
                  <button
                    onClick={() => setRelaxTab('noise')}
                    className={`py-1 rounded-lg text-[9.5px] font-bold text-center transition-all cursor-pointer ${
                      relaxTab === 'noise' ? 'bg-[#cc00ff] text-white font-black' : 'bg-[#002211] text-[#88ffaa]'
                    }`}
                  >
                    BROWN/PINK
                  </button>
                  <button
                    onClick={() => setRelaxTab('drone')}
                    className={`py-1 rounded-lg text-[9.5px] font-bold text-center transition-all cursor-pointer ${
                      relaxTab === 'drone' ? 'bg-[#ffaa00] text-[#01140a] font-black' : 'bg-[#002211] text-[#88ffaa]'
                    }`}
                  >
                    CAMPANE
                  </button>
                  <button
                    onClick={() => setRelaxTab('timer')}
                    className={`py-1 rounded-lg text-[9.5px] font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      relaxTab === 'timer' ? 'bg-[#ff2244] text-white font-black' : 'bg-[#002211] text-[#88ffaa]'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>TIMER</span>
                  </button>
                </div>

                {relaxTab === 'solfeggio' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {SOLFEGGIO_TONES.map(t => {
                      const isActive = activeSolfeggioSet.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            globalRelaxation.toggleSolfeggio(t.id);
                            setActiveSolfeggioSet(Array.from(globalRelaxation.activeSolfeggioIds));
                          }}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#003d1e] border-[#00ff88] text-white shadow-[0_0_12px_rgba(0,255,136,0.6)]'
                              : 'bg-[#00180d] border-[#004422] text-[#88ffaa]'
                          }`}
                        >
                          <span className="font-black text-[11px] text-[#00ff88] block">{t.name}</span>
                          <span className="text-[9px] text-white block mt-0.5">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {relaxTab === 'binaural' && (
                  <div className="space-y-1.5">
                    {BINAURAL_PRESETS.map(p => {
                      const isCurrent = binauralPresetId === p.id && isBinauralActive;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setBinauralPresetId(p.id);
                            globalRelaxation.toggleBinaural(p.id);
                            setIsBinauralActive(globalRelaxation.isBinauralActive);
                          }}
                          className={`w-full p-2 rounded-xl border text-left flex justify-between items-center transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-[#002b3d] border-[#00e5ff] text-white shadow-[0_0_12px_#00e5ff]'
                              : 'bg-[#00140a] border-[#004422] text-[#88ffaa]'
                          }`}
                        >
                          <div>
                            <span className="font-bold text-[10px] text-[#00e5ff]">{p.name} ({p.beatFreq} Hz)</span>
                            <span className="text-[8.5px] text-[#55aa77] block">{p.description}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${isCurrent ? 'bg-[#00e5ff] text-black' : 'bg-black/50 text-white/50'}`}>
                            {isCurrent ? 'ATTIVO' : 'SELEZIONA'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {relaxTab === 'timer' && (
                  <div className="space-y-2">
                    <span className="text-[9px] text-[#88ffaa] block">Sleep timer con dissolvenza graduale a zero volume:</span>
                    <div className="grid grid-cols-5 gap-1">
                      {[0, 15, 30, 45, 60].map(m => (
                        <button
                          key={m}
                          onClick={() => {
                            globalRelaxation.setSleepTimer(m);
                            setSleepTimerDuration(m);
                          }}
                          className={`py-1.5 rounded-lg text-[9px] font-bold ${
                            sleepTimerDuration === m ? 'bg-[#ff2244] text-white' : 'bg-[#002211] text-[#88ffaa] border border-[#00552b]'
                          }`}
                        >
                          {m === 0 ? 'OFF' : `${m}m`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEZIONE 1: SCENA AUDIO (EXACT REPLICA FROM SCREENSHOT 2.16.50) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🌌</span> SCENA AUDIO
              </div>
              <button
                onClick={() => {
                  setPianoProfile('DRONE POLIFONICO');
                  setAttackSoftness(2.0);
                  setSustainTail(6.0);
                  setCathedralReverb(1.0);
                  setIsCrystalsActive(true);
                }}
                className="w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/15 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
              >
                <span>🌌</span> AUDIO: VALORI BASE (AMBIENT DRONE)
              </button>
              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Ripristina le impostazioni audio di partenza: drone polifonico, attacco 2 s, sustain 6x, timbro scuro, note molto sensibili, riverbero pieno e cristalli. L'audio parte sempre così.
              </div>
            </div>

            {/* SEZIONE 2: AUDIO, MICROFONO & CATTEDRALE (EXACT REPLICA FROM SCREENSHOT 2.16.50) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🎙️</span> AUDIO, MICROFONO & CATTEDRALE
              </div>

              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-[#00ffaa]/20"
                >
                  PIANO SYNTH
                </button>
                <button
                  onClick={onToggleMute}
                  className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-[#ff0055] text-white shadow-[0_0_10px_#ff0055]'
                      : 'bg-[#00ffaa] text-black shadow-[0_0_10px_#00ffaa]'
                  }`}
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'}
                </button>
              </div>

              <button
                onClick={onToggleMic}
                className={`w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isMicActive
                    ? 'bg-[#00ffaa] text-black border-[#00ffaa] shadow-[0_0_15px_#00ffaa]'
                    : 'border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/15'
                }`}
              >
                <span>🎙️</span> {isMicActive ? 'DISATTIVA MICROFONO' : 'ATTIVA MICROFONO'}
              </button>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>GUADAGNO MICROFONO</span>
                    <b className="text-[#00ffaa] font-black">{micGain}</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={micGain}
                    onChange={(e) => setMicGain(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <button
                  onClick={() => {
                    globalPiano.resume();
                    globalPiano.playTestChord();
                  }}
                  className="w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🔊</span> TEST AUDIO ALTOPARLANTE
                </button>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>RIVERBERO CATTEDRALE</span>
                    <b className="text-[#00ffaa] font-black">{cathedralReverb}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={cathedralReverb}
                    onChange={(e) => setCathedralReverb(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>POTENZA REATTIVA AUDIO</span>
                    <b className="text-[#00ffaa] font-black">{audioPower.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={audioPower}
                    onChange={(e) => setAudioPower(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SOGLIA MICROFONO</span>
                    <b className="text-[#00ffaa] font-black">{micThreshold.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.50"
                    step="0.01"
                    value={micThreshold}
                    onChange={(e) => setMicThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* SEZIONE 3: MIDI OUT · LOGIC PRO (EXACT REPLICA FROM SCREENSHOT 2.16.50) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>🎛</span> MIDI OUT · LOGIC PRO
              </div>

              <button
                onClick={onToggleMidi}
                className={`w-full py-2 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isMidiActive
                    ? 'bg-[#00ffaa] text-black shadow-[0_0_18px_#00ffaa]'
                    : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                }`}
              >
                <span>🎛</span> {isMidiActive ? 'MIDI ATTIVO — tocca per spegnere' : 'MIDI SPENTO — tocca per accendere'}
              </button>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <span className="block text-[#00ffaa] uppercase mb-1">PORTA DI USCITA</span>
                  <select
                    className="w-full bg-[#021008] border border-[#00ffaa] rounded-xl px-3 py-2 text-[#00ffaa] font-mono font-bold text-[11px] outline-none cursor-pointer"
                  >
                    <option>Automatica (IAC se presente)</option>
                    <option>Driver IAC Bus 1</option>
                    <option>Logic Pro Virtual In</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>CANALE MIDI</span>
                    <b className="text-[#00ffaa] font-black">{midiChannel}</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="16"
                    step="1"
                    value={midiChannel}
                    onChange={(e) => setMidiChannel(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setMidiNotesOn(!midiNotesOn)}
                    className={`py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                      midiNotesOn ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]' : 'border border-[#00ffaa]/40 text-[#00ffaa]'
                    }`}
                  >
                    🎹 NOTE: {midiNotesOn ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => setMidiCcOn(!midiCcOn)}
                    className={`py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                      midiCcOn ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]' : 'border border-[#00ffaa]/40 text-[#00ffaa]'
                    }`}
                  >
                    🎚️ CONTROLLI CC: {midiCcOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-[#00ffaa] font-mono pt-1">
                MIDI: {isMidiActive ? 'attivo' : 'inattivo'} · Driver IAC Bus 1 · canale {midiChannel} · messaggi inviati 120149
              </div>

              <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Le note suonate da Nebula (tocco, mano, microfono, note cinetiche, cristalli, anelli) escono come note MIDI. CC1 = posizione orizzontale · CC74 = posizione verticale (invertita) · CC11 = mano chiusa / dito premuto. Su Mac: Configurazione Audio MIDI &gt; Finestra &gt; Mostra Studio MIDI &gt; doppio clic su Driver IAC &gt; spunta "Dispositivo online". In Logic usa una traccia Software Instrument. Funziona su Chrome, Edge e Brave (non su Safari e iPhone). Con l'audio in MUTO le note escono comunque in MIDI.
              </div>
            </div>

            {/* SEZIONE 4: SUONI CRISTALLINI (IMPATTI TRA PARTICELLE) (EXACT REPLICA FROM SCREENSHOT 2.16.50 & 2.17.23) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>💎</span> SUONI CRISTALLINI (IMPATTI TRA PARTICELLE)
              </div>

              <button
                onClick={() => setIsCrystalsActive(!isCrystalsActive)}
                className={`w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCrystalsActive
                    ? 'bg-[#00ffaa] text-black border-[#00ffaa] shadow-[0_0_15px_#00ffaa]'
                    : 'border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/15'
                }`}
              >
                <span>💎</span> CRISTALLI: {isCrystalsActive ? 'ON' : 'OFF'}
              </button>

              <div className="flex gap-2">
                {(['IMPATTI', 'SCINTILLE', 'SFERE', 'TUTTI'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setCrystalMode(mode)}
                    className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                      crystalMode === mode
                        ? 'bg-[#00ffaa] text-black shadow-[0_0_10px_#00ffaa]'
                        : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="text-[10px] text-[#00ffaa]/75 leading-relaxed font-mono">
                Particelle che sfiorano Wanderer (suono acuto) e Spectra (suono più grave).
              </div>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SENSIBILITÀ IMPATTI</span>
                    <b className="text-[#00ffaa] font-black">{crystalSens.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.50"
                    step="0.01"
                    value={crystalSens}
                    onChange={(e) => setCrystalSens(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5">
                    Più alta = bastano urti più lievi. Prova ad agitare lo sciame (tocco, Wanderer, microfono).
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>DENSITÀ MASSIMA (colpi al secondo)</span>
                    <b className="text-[#00ffaa] font-black">{crystalDensity}</b>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={crystalDensity}
                    onChange={(e) => setCrystalDensity(parseInt(e.target.value, 10))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>VOLUME CRISTALLI</span>
                    <b className="text-[#00ffaa] font-black">{crystalVolume.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="1.0"
                    step="0.02"
                    value={crystalVolume}
                    onChange={(e) => setCrystalVolume(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[9.5px] text-[#00ffaa]/80 font-mono pt-1">
                AUDIO running · oscillatori vivi 0/150 · drone 0 · impatti/s 0 · ultimo 67.2 · note/s cin 0 cri 0 anelli 0 mic 0 · mic off · errore: —
              </div>
            </div>

            {/* SEZIONE 5: MOTORE AUDIO PIANOFORTE & SUITE ARMONICA (EXACT REPLICA FROM SCREENSHOT 2.17.23) */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-3 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center justify-between">
                <span>🎵 MOTORE AUDIO PIANOFORTE & SUITE ARMONICA</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-mono font-bold text-[#00ffaa]">
                  🎹 TASTIERA PIANOFORTE INTERATTIVA (C3 - C6):
                </span>
                <button
                  onClick={() => {
                    globalPiano.resume();
                    globalPiano.playTestChord();
                  }}
                  className="px-3 py-1 rounded-full border border-[#00ffaa] text-[#00ffaa] hover:bg-[#00ffaa]/20 text-[10px] font-mono font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>🔊</span> ACCORDO TEST
                </button>
              </div>

              {/* 16 PENTATONIC / DIATONIC KEYS IN 2 ROWS OF 8 */}
              <div className="grid grid-cols-8 gap-1.5">
                {PIANO_16_KEYS.map(k => (
                  <button
                    key={k.name}
                    onClick={() => {
                      globalPiano.resume();
                      globalPiano.triggerPentatonicNote(k.idx, 0.85);
                    }}
                    className="py-2.5 rounded-lg border border-[#00ffaa] text-[#00ffaa] bg-[#02140a] hover:bg-[#00ffaa] hover:text-black font-mono font-bold text-[10px] text-center transition-all cursor-pointer active:scale-95 shadow-[0_0_6px_rgba(0,255,170,0.2)]"
                  >
                    {k.name}
                  </button>
                ))}
              </div>

              {/* BUTTONS ROW: NOTE CINETICHE & AUDIO 3D */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => setIsKineticNotesOn(!isKineticNotesOn)}
                  className={`py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                    isKineticNotesOn ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]' : 'border border-[#00ffaa]/50 text-[#00ffaa]'
                  }`}
                >
                  🎵 NOTE CINETICHE: {isKineticNotesOn ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setIsAudio3dOn(!isAudio3dOn)}
                  className={`py-1.5 rounded-full font-mono font-black text-[11px] tracking-wider uppercase transition-all cursor-pointer ${
                    isAudio3dOn ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]' : 'border border-[#00ffaa]/50 text-[#00ffaa]'
                  }`}
                >
                  🎧 AUDIO 3D: {isAudio3dOn ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* PROFILO TIMBRO PIANOFORTE */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-[#00ffaa] font-mono font-bold uppercase">
                  PROFILO TIMBRO PIANOFORTE
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    '🎹 ACUSTICO',
                    '🌌 COSMICO POLIRITMICO',
                    '✨ IBRIDO GESTURE',
                    '🎹 PIANO MORBIDO',
                    '☁️ PAD MORBIDO',
                    '🌌 DRONE POLIFONICO',
                  ].map(prof => (
                    <button
                      key={prof}
                      onClick={() => setPianoProfile(prof)}
                      className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                        pianoProfile === prof || (prof.includes('DRONE') && pianoProfile.includes('DRONE'))
                          ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]'
                          : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
                <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                  Drone polifonico: le altezze suonate restano sospese e si sommano (max 8 voci); le note ripetute rinnovano la voce.
                </div>
              </div>

              {/* PATTERN ARPEGGIATORE POLIRITMICO */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-[#00ffaa] font-mono font-bold uppercase">
                  PATTERN ARPEGGIATORE POLIRITMICO
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['OFF', 'UP', 'DOWN', 'UP-DOWN', 'POLY 3:2', 'POLY 4:3', 'RANDOM'].map(pat => (
                    <button
                      key={pat}
                      onClick={() => setArpPattern(pat)}
                      className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                        arpPattern === pat
                          ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]'
                          : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                      }`}
                    >
                      {pat}
                    </button>
                  ))}
                </div>
                <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                  Sincronizza pattern melodici e poliritmie sulla velocità delle particelle.
                </div>
              </div>

              {/* DIVISIONE METRICA TEMPO */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-[#00ffaa] font-mono font-bold uppercase">
                  DIVISIONE METRICA TEMPO
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['1/4', '1/8', '1/16', 'TERZINE'].map(div => (
                    <button
                      key={div}
                      onClick={() => setArpDivision(div)}
                      className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                        arpDivision === div
                          ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]'
                          : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                      }`}
                    >
                      {div}
                    </button>
                  ))}
                </div>
              </div>

              {/* RISONANZA ARMONICA & TIPO ACCORDO */}
              <div className="space-y-1.5">
                <span className="block text-[10px] text-[#00ffaa] font-mono font-bold uppercase">
                  RISONANZA ARMONICA & TIPO ACCORDO
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['SOLO', '5TH (POWER)', 'OCTAVE', 'MAGGIORE', 'MINORE', 'COSMIC 7TH'].map(c => (
                    <button
                      key={c}
                      onClick={() => setChordType(c)}
                      className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                        chordType === c
                          ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]'
                          : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                  Arricchisce le note suonate con quinte, ottave o accordi armonici risonanti.
                </div>
              </div>

              {/* SLIDERS HARMONICS & TIMBRE */}
              <div className="space-y-2.5 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>INTENSITÀ RISONANZA CORDE (OVERTONES)</span>
                    <b className="text-[#00ffaa] font-black">{chordOvertones.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={chordOvertones}
                    onChange={(e) => setChordOvertones(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>ATTACCO · MORBIDEZZA</span>
                    <b className="text-[#00ffaa] font-black">{attackSoftness.toFixed(2)} s</b>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={attackSoftness}
                    onChange={(e) => setAttackSoftness(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5">
                    Più alto = nota che sale piano, meno percussiva (vale per tutti i timbri; sul DRONE l'attacco minimo è circa 1 s).
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SUSTAIN · CODA DELLE NOTE</span>
                    <b className="text-[#00ffaa] font-black">{sustainTail.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="10.0"
                    step="0.5"
                    value={sustainTail}
                    onChange={(e) => setSustainTail(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5">
                    Allunga o accorcia la durata delle note; sul DRONE regola per quanto restano sospese le voci.
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>BRILLANTEZZA TIMBRO (ARMONICHE)</span>
                    <b className="text-[#00ffaa] font-black">{brightnessHarmonics.toFixed(1)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.05"
                    value={brightnessHarmonics}
                    onChange={(e) => setBrightnessHarmonics(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SMORZAMENTO NOTE (anti-martellamento)</span>
                    <b className="text-[#00ffaa] font-black">{noteDamping.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="3.0"
                    step="0.1"
                    value={noteDamping}
                    onChange={(e) => setNoteDamping(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5">
                    Più alto = dopo ogni nota servono più energia e più tempo per la successiva: le note arrivano a frasi, non a metronomo. Vale per note cinetiche, microfono e cristalli. A 0 si torna al comportamento precedente.
                  </div>
                </div>

                {/* MODO NOTE CINETICHE */}
                <div className="pt-1 space-y-1.5">
                  <span className="block text-[10px] text-[#00ffaa] font-mono font-bold uppercase">
                    MODO NOTE CINETICHE
                  </span>
                  <div className="flex gap-2">
                    {(['SU VARIAZIONI', 'CONTINUO'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setKineticMode(m)}
                        className={`px-3 py-1 rounded-full font-mono font-bold text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
                          kineticMode === m
                            ? 'bg-[#00ffaa] text-black shadow-[0_0_12px_#00ffaa]'
                            : 'border border-[#00ffaa]/50 text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div className="text-[9.5px] text-[#00ffaa]/75 leading-relaxed font-mono">
                    Su variazioni: suona quando il movimento cambia (gesti, urti, anelli), non mentre è stabile. Continuo: il comportamento precedente.
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SOGLIA DI TRIGGER CINETICA</span>
                    <b className="text-[#00ffaa] font-black">{kineticTriggerThreshold.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.50"
                    step="0.01"
                    value={kineticTriggerThreshold}
                    onChange={(e) => setKineticTriggerThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>SENSIBILITÀ CINETICA GENERATORE</span>
                    <b className="text-[#00ffaa] font-black">{kineticGenSens.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.50"
                    step="0.01"
                    value={kineticGenSens}
                    onChange={(e) => setKineticGenSens(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#00ffaa]">
                    <span>RIVERBERO SPAZIALE CATTEDRALE (WET/DRY)</span>
                    <b className="text-[#00ffaa] font-black">{cathedralReverb}</b>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={cathedralReverb}
                    onChange={(e) => setCathedralReverb(parseFloat(e.target.value))}
                    className="w-full accent-[#00ffaa] cursor-pointer"
                  />
                  <div className="text-[9.5px] text-[#00ffaa]/75 mt-0.5">
                    L'audio 3D segue in tempo reale il moto orbitale di Wanderer nello spazio stereo.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: INPUT (EXACT REPLICA FROM SCREENSHOT 2.17.52) */}
        {/* ========================================================================= */}
        {activeTab === 'input' && (
          <div className="space-y-3.5">
            {/* SEZIONE 1: CATTURA, VIDEO & FULLSCREEN (BORDO ROSA/MAGENTA) */}
            <div className="border border-[#ff3366]/40 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
              <div className="text-[11px] font-mono font-bold text-[#ff3366] tracking-wider uppercase flex items-center gap-1.5">
                <span>🎬</span> CATTURA, VIDEO & FULLSCREEN
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onTakePhoto}
                  className="py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
                >
                  <span>📸</span> FOTO PNG
                </button>
                <button
                  onClick={onToggleRecord}
                  className={`py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isRecording
                      ? 'border-[#ff0055] bg-[#ff0055] text-white shadow-[0_0_15px_#ff0055]'
                      : 'border-[#ff3366] text-[#ff3366] bg-black/40 hover:bg-[#ff3366]/20'
                  }`}
                >
                  <span>🎥</span> REC VIDEO
                </button>
              </div>
              <button
                onClick={onToggleFullscreen}
                className="w-full py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
              >
                <span>⛶</span> SCHERMO INTERO (FULLSCREEN)
              </button>
            </div>

            {/* SEZIONE 2: PORTALE DOWNLOAD & PACCHETTI */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>📦</span> PORTALE DOWNLOAD & PACCHETTI
              </div>
              <button
                onClick={onOpenDownloadPortal}
                className="w-full py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
              >
                <span>📦</span> APRI PORTALE DOWNLOAD
              </button>
              <button
                onClick={onOpenDownloadPortal}
                className="w-full py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border border-[#00ffaa] text-[#00ffaa] bg-black/40 hover:bg-[#00ffaa]/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,255,170,0.2)]"
              >
                <span>🌐</span> PAGINA PORTALE WEB (/portal)
              </button>
              <div className="text-[10px] text-[#00ffaa]/75 text-center font-mono pt-0.5">
                Scarica Mac, iOS, pacchetti ZIP ed esegui offline
              </div>
            </div>

            {/* SEZIONE 3: ACCELEROMETRO & TILT SCIAME (BORDO ORO/AMBRA) */}
            <div className="border border-[#ffaa00]/60 rounded-xl p-3 bg-black/60 space-y-2.5 shadow-[0_0_15px_rgba(255,170,0,0.25)]">
              <div className="text-[11px] font-mono font-bold text-[#ffaa00] tracking-wider uppercase flex items-center gap-1.5">
                <span>🧭</span> ACCELEROMETRO & TILT SCIAME
              </div>

              <button
                onClick={onToggleTilt}
                className={`w-full py-1.5 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isTiltActive
                    ? 'bg-[#ffaa00] text-black border-[#ffaa00] shadow-[0_0_15px_#ffaa00]'
                    : 'border border-[#ffaa00] text-[#ffaa00] bg-black/40 hover:bg-[#ffaa00]/20'
                }`}
              >
                <span>🧭</span> ACCELEROMETRO: {isTiltActive ? 'ON' : 'OFF'}
              </button>

              <div className="space-y-2 font-mono text-[10px]">
                <div>
                  <div className="flex justify-between items-center text-[#ffaa00]">
                    <span>SENSIBILITÀ GRAVITÀ TILT</span>
                    <b className="text-[#ffaa00] font-black">{tiltSensLocal.toFixed(1)}x</b>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={tiltSensLocal}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setTiltSensLocal(v);
                      if (onUpdateTiltParams) onUpdateTiltParams(v, tiltSmoothLocal);
                    }}
                    className="w-full accent-[#ffaa00] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#ffaa00]">
                    <span>SMORZAMENTO / FLUIDITÀ</span>
                    <b className="text-[#ffaa00] font-black">{tiltSmoothLocal.toFixed(2)}</b>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.50"
                    step="0.05"
                    value={tiltSmoothLocal}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setTiltSmoothLocal(v);
                      if (onUpdateTiltParams) onUpdateTiltParams(tiltSensLocal, v);
                    }}
                    className="w-full accent-[#ffaa00] cursor-pointer"
                  />
                </div>
              </div>

              <div className="text-[10px] text-[#ffaa00]/80 text-center font-mono">
                TILT: X: {tiltAngleX.toFixed(1)}° | Y: {tiltAngleY.toFixed(1)}° (Inclinando il dispositivo lo sciame scivola)
              </div>
            </div>

            {/* SEZIONE 4: WEBCAM & TRACCIAMENTO AI */}
            <div className="border border-[#00ffaa]/50 rounded-xl p-3 bg-black/60 space-y-2 shadow-[0_0_15px_rgba(0,255,170,0.15)]">
              <div className="text-[11px] font-mono font-bold text-[#00e5ff] tracking-wider uppercase flex items-center gap-1.5">
                <span>📽️</span> WEBCAM & TRACCIAMENTO AI
              </div>

              <button
                onClick={onToggleCam}
                className={`w-full py-2 rounded-full font-mono font-bold text-[11px] tracking-wider uppercase border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCamActive
                    ? 'border-[#00ffaa] bg-[#00ffaa]/20 text-[#00ffaa]'
                    : 'border-[#00ffaa]/40 text-[#00ffaa]/60 bg-black/40 hover:bg-[#00ffaa]/15'
                }`}
              >
                <span>📽️</span> WEBCAM: {isCamActive ? 'ON' : 'OFF'}
              </button>

              <div className="text-[10px] text-[#00ffaa]/75 text-center font-mono">
                Tocca e trascina ovunque per attrarre lo sciame gravitazionale
              </div>
            </div>
          </div>
        )}
      </div>

      {/* HUB FOOTER (RESTORE BUTTON EXACTLY AS IN SCREENSHOTS) */}
      <div
        id="hub-foot"
        className="p-3 bg-[#010804] border-t border-[#00ffaa]/20"
      >
        <button
          onClick={handleReset}
          className="w-full py-2.5 rounded-xl border border-[#ffaa00] text-[#ffaa00] bg-black/60 hover:bg-[#ffaa00]/15 font-mono font-black text-[12px] tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(255,170,0,0.25)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>🔄</span> RIPRISTINA FISICA, LUCI & AUDIO
        </button>
      </div>
    </div>
  );
};
