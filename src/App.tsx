/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { EngineMode, SimulationParams, CustomPreset, GeometryType } from './types.ts';
import { SacredMotherEngine } from './engine/sacredMother.ts';
import { RemasteredEngine, REMASTERED_KEYS } from './engine/remasteredEngine.ts';
import { PipPreview } from './components/PipPreview.tsx';
import { PresetPill } from './components/PresetPill.tsx';
import { BottomDock, HubTabType } from './components/BottomDock.tsx';
import { HubDrawer } from './components/HubDrawer.tsx';
import { PresetModal } from './components/PresetModal.tsx';
import { RecordingModal } from './components/RecordingModal.tsx';
import { DownloadPortalModal } from './components/DownloadPortalModal.tsx';
import { globalPiano } from './audio/pianoEngine.ts';
import { globalRelaxation } from './audio/relaxationEngine.ts';
import { globalHandTracker, HandTrackingResult } from './vision/handTracker.ts';
import { globalVideoRecorder, RecordedSession } from './utils/videoRecorder.ts';

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine instance refs
  const motherEngineRef = useRef<SacredMotherEngine | null>(null);
  const remasteredEngineRef = useRef<RemasteredEngine | null>(null);

  // State
  const [engineMode, setEngineMode] = useState<EngineMode>('REMASTERED');
  const [currentV, setCurrentV] = useState<string>('V13');
  const [currentGeoType, setCurrentGeoType] = useState<GeometryType>('octa');
  const [isCycleActive, setIsCycleActive] = useState<boolean>(false);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [recordedSession, setRecordedSession] = useState<RecordedSession | null>(null);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isDownloadPortalOpen, setIsDownloadPortalOpen] = useState<boolean>(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [isMidiConnected, setIsMidiConnected] = useState<boolean>(false);
  const [midiName, setMidiName] = useState<string>("Disconnesso");

  // Bottom dock and Hub drawer state
  const [activeHubTab, setActiveHubTab] = useState<HubTabType>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [isTiltActive, setIsTiltActive] = useState<boolean>(false);
  const [tiltAngles, setTiltAngles] = useState<{ x: number; y: number; force: number }>({ x: 0, y: 0, force: 1.0 });
  const [fps, setFps] = useState<number>(60);
  const prevPianoVolRef = useRef<number>(0.8);

  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    friction: 0.96,
    elasticity: 0.0016,
    handPower: 5.5,
    zoom: 600,
    rotX: 0.001,
    rotY: 0.002,
    rotZ: 0.000,
    pSpin: 1.2,
    trailOpacity: 0.14,
    motionBlur: 0.14,
    bloomIntensity: 1.0,
    hueRotationSpeed: 1.0,
    pSize: 3.2,
    pLumina: 10.0,
    audioThreshold: 0.12,
    cycleTime: 5.0,
    spectraPull: 45.0,
    audioPower: 1.5,
    wanderOrbit: 0.8,
    spectraOrbit: 1.2,
    wanderPush: 25.0,
    sunX: 400,
    sunY: 600,
    sunZ: 500,
    sunIntensity: 1.2,
    ambientIntensity: 0.6,
    particleCount: 12000,
    touchMode: 'ATTRACT',
    audioMode: 'SYNTH',
    pianoVolume: 0.8,
    reverbAmount: 0.65,
    pianoBrightness: 0.75,
    triggerRateMs: 160,
    triggerSensitivity: 0.75,
    trigGesture: true,
    trigPinch: true,
    trigClick: true,
    trigCollision: false,
    trigBpm: false,
    particleBrightness: 0.48,
    particleSaturation: 0.95,
    particleShininess: 20,
    radialExpansion: 8.0,
    centerAttraction: 2.0
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const triggerToast = (text: string, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Auto-load preset on initial mount and check download portal deep link
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nebula_core_autosaved_preset');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.params) {
          setSimulationParams(prev => ({ ...prev, ...parsed.params }));
          if (parsed.version) setCurrentV(parsed.version);
        }
      }
    } catch (e) {
      console.warn("Failed to load auto-saved preset", e);
    }

    const checkDownloadPortalLink = () => {
      const hash = window.location.hash.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (hash.includes('download') || params.get('download') !== null || params.get('portal') === 'download') {
        setIsDownloadPortalOpen(true);
      }
    };
    checkDownloadPortalLink();
    window.addEventListener('hashchange', checkDownloadPortalLink);
    return () => window.removeEventListener('hashchange', checkDownloadPortalLink);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Connect piano note trigger callback to UI highlighting & MIDI listeners
  useEffect(() => {
    globalPiano.onNoteTrigger = (_name, idx, _freq) => {
      setActiveNoteIdx(idx);
      globalHandTracker.activeNote = `${_name} [${Math.round(_freq)}Hz]`;
    };
    globalPiano.onMidiStatusChange = (connected, name) => {
      setIsMidiConnected(connected);
      setMidiName(name);
    };
    globalPiano.initMidi().then(ok => {
      setIsMidiConnected(ok);
      setMidiName(globalPiano.midiDeviceName);
    }).catch(() => {});
  }, []);

  // Mount active 3D Engine
  const startEngine = useCallback((mode: EngineMode) => {
    if (!containerRef.current) return;

    // Teardown previous engine
    if (motherEngineRef.current) {
      motherEngineRef.current.unmount();
      motherEngineRef.current = null;
    }
    if (remasteredEngineRef.current) {
      remasteredEngineRef.current.unmount();
      remasteredEngineRef.current = null;
    }

    if (mode === 'MOTHER') {
      const mother = new SacredMotherEngine();
      mother.mount(containerRef.current);
      motherEngineRef.current = mother;
      setCurrentV(mother.currentV);
    } else {
      const remastered = new RemasteredEngine();
      remastered.liveParams = { ...simulationParams };
      remastered.mount(containerRef.current);
      remasteredEngineRef.current = remastered;
      setCurrentV(remastered.currentV);
      setCurrentGeoType(remastered.currentGeoType);
    }
  }, [simulationParams]);

  useEffect(() => {
    startEngine(engineMode);
    return () => {
      if (motherEngineRef.current) motherEngineRef.current.unmount();
      if (remasteredEngineRef.current) remasteredEngineRef.current.unmount();
    };
  }, [engineMode, startEngine]);

  // Connect hand tracking stream to active engine and piano
  useEffect(() => {
    globalHandTracker.onTrackingResult = (res: HandTrackingResult) => {
      if (engineMode === 'MOTHER' && motherEngineRef.current) {
        motherEngineRef.current.setHandTarget(res.targetPos.x, res.targetPos.y, res.isClosed, res.isPresent);
      } else if (remasteredEngineRef.current) {
        remasteredEngineRef.current.setHandTarget(res.targetPos.x, res.targetPos.y, res.isClosed, res.isPresent);
      }

      if (res.isPresent && simulationParams.audioMode !== 'OFF') {
        globalPiano.updateFromCoordinates(res.normX, res.normY, res.isClosed, {
          trigGesture: simulationParams.trigGesture,
          trigPinch: simulationParams.trigPinch
        });
      }
    };
  }, [engineMode, simulationParams.audioMode, simulationParams.trigGesture, simulationParams.trigPinch]);

  // Recording Timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecording]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setEngineMode(m => (m === 'MOTHER' ? 'REMASTERED' : 'MOTHER'));
      } else if (e.code === 'KeyW') {
        setIsWebcamActive(a => !a);
      } else if (e.code === 'KeyC') {
        handleToggleCycle();
      } else if (e.code === 'KeyR' && e.shiftKey) {
        handleResetCamera();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers
  const handleUpdateParams = (newParams: Partial<SimulationParams>) => {
    const merged = { ...simulationParams, ...newParams };
    setSimulationParams(merged);

    if (remasteredEngineRef.current) {
      remasteredEngineRef.current.liveParams = { ...merged };
      if (newParams.particleCount && newParams.particleCount !== simulationParams.particleCount) {
        remasteredEngineRef.current.allocSwarmBuffers(newParams.particleCount);
        remasteredEngineRef.current.loadSwarm(remasteredEngineRef.current.currentV);
      }
      if (newParams.sunX !== undefined || newParams.sunY !== undefined || newParams.sunZ !== undefined || newParams.sunIntensity !== undefined || newParams.ambientIntensity !== undefined) {
        remasteredEngineRef.current.applySunLights();
      }
      if (newParams.pSize !== undefined) {
        remasteredEngineRef.current.loadSwarm(remasteredEngineRef.current.currentV);
      }
      if (newParams.particleShininess !== undefined) {
        remasteredEngineRef.current.updateShininess(newParams.particleShininess);
      }
      if (newParams.zoom !== undefined) {
        remasteredEngineRef.current.setZoom(newParams.zoom);
      }
    } else if (engineMode === 'MOTHER' && motherEngineRef.current?.camera && newParams.zoom !== undefined) {
      motherEngineRef.current.camera.position.z = newParams.zoom;
    }
  };

  const handleSelectVersion = (v: string) => {
    setCurrentV(v);
    if (engineMode === 'MOTHER' && motherEngineRef.current) {
      motherEngineRef.current.loadSwarm(v);
    } else if (remasteredEngineRef.current) {
      remasteredEngineRef.current.loadSwarm(v);
    }
  };

  const handleToggleCycle = () => {
    const nextState = !isCycleActive;
    setIsCycleActive(nextState);
    if (engineMode === 'MOTHER' && motherEngineRef.current) {
      motherEngineRef.current.cycleActive = nextState;
    } else if (remasteredEngineRef.current) {
      remasteredEngineRef.current.cycleActive = nextState;
    }
  };

  const handleToggleWebcam = async () => {
    globalPiano.resume();
    const next = !isWebcamActive;
    setIsWebcamActive(next);
    if (next) {
      triggerToast("AVVIO WEBCAM PIP (Hand tracking attivo / Virtual pad)");
    } else {
      triggerToast("WEBCAM CHIUSA");
    }
  };

  const handleToggleMic = async () => {
    globalPiano.resume();
    const activeEngine = engineMode === 'MOTHER' ? motherEngineRef.current : remasteredEngineRef.current;
    if (activeEngine) {
      if (!isMicActive) {
        const ok = await activeEngine.startMicrophone();
        setIsMicActive(ok);
        if (ok) {
          triggerToast("✓ MICROFONO ATTIVO (Reazione armonica frequenze)");
        } else {
          triggerToast("⚠️ Permesso microfono negato o non supportato nel browser", true);
        }
      } else {
        activeEngine.stopMicrophone();
        setIsMicActive(false);
        triggerToast("MICROFONO DISATTIVATO");
      }
    }
  };

  const handleToggleMidi = async () => {
    const ok = await globalPiano.initMidi();
    setIsMidiConnected(ok);
    setMidiName(globalPiano.midiDeviceName);
    if (ok) {
      triggerToast(`✓ MIDI ATTIVO PER LOGIC PRO: ${globalPiano.midiDeviceName}`);
    } else {
      triggerToast(`⚠️ MIDI: ${globalPiano.midiDeviceName} (attiva il Driver IAC in Configurazione Audio MIDI)`, true);
    }
  };

  const handleResetCamera = () => {
    const activeEngine = engineMode === 'MOTHER' ? motherEngineRef.current : remasteredEngineRef.current;
    if (activeEngine && activeEngine.camera) {
      activeEngine.camera.position.set(0, 0, 600);
      activeEngine.camera.lookAt(0, 0, 0);
    }
  };

  const handleSnapshot = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);
    const activeEngine = engineMode === 'MOTHER' ? motherEngineRef.current : remasteredEngineRef.current;
    if (activeEngine && activeEngine.renderer && activeEngine.scene && activeEngine.camera) {
      activeEngine.renderer.render(activeEngine.scene, activeEngine.camera);
      const a = document.createElement('a');
      a.download = `NebulaCore_${engineMode}_${Date.now()}.png`;
      a.href = activeEngine.renderer.domElement.toDataURL('image/png');
      a.click();
    }
    triggerToast("📸 Screenshot PNG Salvato!");
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      prevPianoVolRef.current = simulationParams.pianoVolume;
      globalPiano.setVolume(0);
      globalRelaxation.setMasterVolume(0);
      setIsMuted(true);
      triggerToast("🔇 Audio Silenziato");
    } else {
      const restored = prevPianoVolRef.current || 0.8;
      globalPiano.setVolume(restored);
      globalRelaxation.setMasterVolume(0.7);
      setIsMuted(false);
      triggerToast("🔊 Audio Riattivato");
    }
  };

  const handleToggleTouchMode = () => {
    const nextMode = simulationParams.touchMode === 'ATTRACT' ? 'REPEL' : 'ATTRACT';
    handleUpdateParams({ touchMode: nextMode });
    triggerToast(nextMode === 'REPEL' ? "💥 Modalità Forza: REPULSIONE" : "🧲 Modalità Forza: ATTRAZIONE");
  };

  const isTrailsActive = simulationParams.trailOpacity > 0.05;
  const handleToggleTrails = () => {
    const nextVal = isTrailsActive ? 0.02 : 0.14;
    handleUpdateParams({ trailOpacity: nextVal, motionBlur: nextVal });
    triggerToast(nextVal > 0.05 ? "🌠 Scie & Motion Blur: ATTIVI" : "🌠 Scie Particelle: DISATTIVE");
  };

  const isRotActive = Math.abs(simulationParams.rotY) > 0.0001;
  const handleToggleRot = () => {
    if (isRotActive) {
      handleUpdateParams({ rotX: 0, rotY: 0, rotZ: 0 });
      triggerToast("🔄 Autorotazione: OFF");
    } else {
      handleUpdateParams({ rotX: 0.001, rotY: 0.002, rotZ: 0.000 });
      triggerToast("🔄 Autorotazione: ON");
    }
  };

  const handleToggleTilt = async () => {
    if (!isTiltActive) {
      const DeviceOrientationClass = window.DeviceOrientationEvent as any;
      if (typeof DeviceOrientationClass !== 'undefined' && typeof DeviceOrientationClass.requestPermission === 'function') {
        try {
          const perm = await DeviceOrientationClass.requestPermission();
          if (perm !== 'granted') {
            triggerToast("Permesso accelerometro non concesso", true);
            return;
          }
        } catch (e) {
          console.warn("DeviceOrientation error", e);
        }
      }
      setIsTiltActive(true);
      triggerToast("🧭 Giroscopio & Gravità TILT Attivati");
    } else {
      setIsTiltActive(false);
      if (remasteredEngineRef.current) {
        remasteredEngineRef.current.setTiltForce(0, 0);
      }
      triggerToast("Giroscopio TILT Disattivato");
    }
  };

  // Tilt DeviceOrientation Event Listener
  useEffect(() => {
    if (!isTiltActive) return;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma || 0;
      const beta = e.beta || 0;
      setTiltAngles({ x: gamma, y: beta, force: 1.0 });

      const tiltX = Math.max(-1.5, Math.min(1.5, gamma / 35.0));
      const tiltY = Math.max(-1.5, Math.min(1.5, -beta / 35.0));

      if (remasteredEngineRef.current) {
        remasteredEngineRef.current.setTiltForce(tiltX * 4.0, tiltY * 4.0);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (remasteredEngineRef.current) {
        remasteredEngineRef.current.setTiltForce(0, 0);
      }
    };
  }, [isTiltActive]);

  const handleToggleRecording = async () => {
    const activeEngine = engineMode === 'MOTHER' ? motherEngineRef.current : remasteredEngineRef.current;
    if (!activeEngine || !activeEngine.renderer) return;

    if (!isRecording) {
      const ok = globalVideoRecorder.startRecording(activeEngine.renderer.domElement);
      if (ok) setIsRecording(true);
    } else {
      try {
        const session = await globalVideoRecorder.stopRecording();
        setIsRecording(false);
        setRecordedSession(session);
      } catch (err) {
        console.error("Recording stop error", err);
        setIsRecording(false);
      }
    }
  };

  const handleApplyPreset = (preset: CustomPreset) => {
    handleSelectVersion(preset.version);
    if (preset.params) {
      handleUpdateParams(preset.params);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#020905]">
      {/* 3D WebGL Canvas Container */}
      <div
        ref={containerRef}
        id="canvas-container"
        className="absolute inset-0 w-full h-full z-0 touch-none"
      />

      {/* MINIMAL TOP PRESET PILL (Auto-fades after inactivity) */}
      <PresetPill
        currentV={currentV}
        fps={fps}
        onSelectVersion={handleSelectVersion}
      />

      {/* FLASH OVERLAY FOR PHOTO SNAPSHOT */}
      <div
        id="flash-overlay"
        className={`fixed inset-0 bg-white z-[99999] pointer-events-none transition-opacity duration-200 ${
          isFlashing ? 'opacity-60' : 'opacity-0'
        }`}
      />

      {/* Dynamic System Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-xl backdrop-blur-md transition-all ${
          toastMessage.isError
            ? 'bg-[#330000]/90 border border-[#ff3333] text-[#ff8888] shadow-[#ff0000]/20'
            : 'bg-[#002b15]/90 border border-[#00ff88] text-[#00ff88] shadow-[#00ff88]/20'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Floating Picture-In-Picture Webcam Window */}
      <PipPreview
        isWebcamActive={isWebcamActive}
        onToggleWebcam={handleToggleWebcam}
      />

      {/* EXPANDABLE HUB DRAWER (34% / 56% / 80% Heights) */}
      <HubDrawer
        activeTab={activeHubTab}
        onClose={() => setActiveHubTab(null)}
        params={simulationParams}
        onUpdateParams={handleUpdateParams}
        currentV={currentV}
        onSelectVersion={handleSelectVersion}
        engineMode={engineMode}
        onSelectEngineMode={(mode) => setEngineMode(mode)}
        currentGeoType={currentGeoType}
        onChangeGeoType={(geo) => {
          setCurrentGeoType(geo);
          if (remasteredEngineRef.current) remasteredEngineRef.current.setGeometryType(geo);
        }}
        isCycleActive={isCycleActive}
        onToggleCycle={handleToggleCycle}
        isCamActive={isWebcamActive}
        onToggleCam={handleToggleWebcam}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        isTiltActive={isTiltActive}
        onToggleTilt={handleToggleTilt}
        tiltAngleX={tiltAngles.x}
        tiltAngleY={tiltAngles.y}
        tiltForce={tiltAngles.force}
        onUpdateTiltParams={(force) => {
          setTiltAngles(prev => ({ ...prev, force }));
        }}
        cycleTime={simulationParams.cycleTime}
        onUpdateCycleTime={(time) => handleUpdateParams({ cycleTime: time })}
        isTrailsActive={isTrailsActive}
        onToggleTrails={handleToggleTrails}
        isAutorotActive={isRotActive}
        onToggleAutorot={handleToggleRot}
        touchMode={simulationParams.touchMode}
        onToggleTouchMode={handleToggleTouchMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTakePhoto={handleSnapshot}
        isRecording={isRecording}
        onToggleRecord={handleToggleRecording}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenDownloadPortal={() => setIsDownloadPortalOpen(true)}
        isMidiActive={isMidiConnected}
        midiDeviceName={midiName}
        onToggleMidi={handleToggleMidi}
        onResetPhysics={() => handleUpdateParams({
          friction: 0.94,
          elasticity: 0.002,
          handPower: 14.0,
          pSize: 2.8,
          centerAttraction: 0.25,
          zoom: 3200,
          wanderOrbit: 1.0,
          spectraOrbit: 1.0,
          wanderPush: 1.0,
          spectraPull: 1.0,
          sunIntensity: 2.5,
          ambientIntensity: 0.6,
          pianoVolume: 0.8,
          reverbAmount: 1.0,
          pianoBrightness: 0.2,
          rotX: 0.1,
          rotY: -0.1,
          rotZ: 0.2,
        })}
      />

      {/* EXACT REPLICATED GITHUB BOTTOM DOCK */}
      <BottomDock
        activeTab={activeHubTab}
        onSelectTab={(tab) => setActiveHubTab(tab)}
        isMicActive={isMicActive}
        onToggleMic={handleToggleMic}
        isCamActive={isWebcamActive}
        onToggleCam={handleToggleWebcam}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onTakePhoto={handleSnapshot}
        isRecording={isRecording}
        recordSeconds={recordSeconds}
        onToggleRecord={handleToggleRecording}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenPresetModal={() => setIsPresetModalOpen(true)}
        isMidiActive={isMidiConnected}
        midiDeviceName={midiName}
        onToggleMidi={handleToggleMidi}
        isCycleActive={isCycleActive}
        cycleTime={simulationParams.cycleTime}
        onToggleCycle={handleToggleCycle}
        isRotActive={isRotActive}
        onToggleRot={handleToggleRot}
        touchMode={simulationParams.touchMode}
        onToggleTouchMode={handleToggleTouchMode}
        isTrailsActive={isTrailsActive}
        onToggleTrails={handleToggleTrails}
        isTiltActive={isTiltActive}
        onToggleTilt={handleToggleTilt}
      />

      {/* Preset Storage & Sharing Dialog */}
      <PresetModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentVersion={currentV}
        currentParams={simulationParams}
        onApplyPreset={handleApplyPreset}
      />

      {/* Video Recording & Social Share Modal */}
      <RecordingModal
        session={recordedSession}
        onClose={() => setRecordedSession(null)}
      />

      {/* Official Download & Offline Portal Modal */}
      <DownloadPortalModal
        isOpen={isDownloadPortalOpen}
        onClose={() => setIsDownloadPortalOpen(false)}
      />

      {/* Shortcuts Helper Bar */}
      <div className="fixed bottom-2 left-3 z-20 hidden lg:block text-[9px] font-mono text-[#44aa66] bg-[#020603]/80 px-2 py-0.5 rounded border border-[#00ff88]/20 pointer-events-none">
        <b className="text-[#00e5ff]">[M]</b> Mother/Remaster | <b className="text-[#00e5ff]">[W]</b> Cam | <b className="text-[#00e5ff]">[C]</b> Cycle | <b className="text-[#00e5ff]">[CLICK/TOUCH]</b> Piano
      </div>
    </div>
  );
}
