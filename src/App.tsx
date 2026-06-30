import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Video, Sliders, Play, Trash2, Cpu, Sparkles, Smartphone, Eye, X, MessageSquare, Battery, Wifi, Signal } from 'lucide-react';

// --- STABLE GLASS PHYSICAL 3D SMARTPHONE COMPONENT ---
function GlassChassisPhone({ screenTexUrl, caseColor, appCoords, onAppClick, isLocked, setIsLocked, systemTime }) {
  const modelPivotGroup = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [compositeTexture, setCompositeTexture] = useState<THREE.CanvasTexture | null>(null);
  const [wallpaperImage, setWallpaperImage] = useState<HTMLImageElement | null>(null);

  // Smooth floating passive rotation sequence
  useFrame((state) => {
    if (modelPivotGroup.current) {
      modelPivotGroup.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.1) * 0.05;
      modelPivotGroup.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.03;
    }
    if (compositeTexture) compositeTexture.needsUpdate = true;
  });

  // Pre-render the wallpaper layout image buffer
  useEffect(() => {
    if (screenTexUrl) {
      const img = new Image();
      img.src = screenTexUrl;
      img.onload = () => setWallpaperImage(img);
    } else {
      setWallpaperImage(null);
    }
  }, [screenTexUrl]);

  // Dynamic system UI compositor engine drawing directly to active WebGL textures
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 2220;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw base extracted phone interface screen layer
      if (wallpaperImage) {
        ctx.drawImage(wallpaperImage, 0, 0, canvas.width, canvas.height);
      } else {
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 2. Render functional live translucent top system bars
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(0, 0, canvas.width, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(systemTime, 60, 60);

      // 3. Render lock screen dynamic security guards
      if (isLocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 84px sans-serif';
        ctx.fillText(systemTime, canvas.width / 2, 450);
        
        ctx.font = '40px sans-serif';
        ctx.fillStyle = '#a5b4fc';
        ctx.fillText('🔒 Tap Display to Authenticate', canvas.width / 2, 1800);
        ctx.textAlign = 'left'; // Reset alignment metrics
      }

      // 4. Render debugging asset overlay targets visually if unlocked
      if (!isLocked && appCoords.length > 0) {
        appCoords.forEach(app => {
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.lineWidth = 4;
          ctx.strokeRect((app.x * canvas.width / 100) - 75, (app.y * canvas.height / 100) - 75, 150, 150);
        });
      }
    };

    renderLoop();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    setCompositeTexture(tex);
  }, [wallpaperImage, isLocked, appCoords, systemTime]);

  return (
    <group ref={modelPivotGroup}>
      <RoundedBox args={[3.2, 6.4, 0.22]} radius={0.34} smoothness={6}>
        <meshStandardMaterial color={caseColor || "#0f172a"} metalness={0.9} roughness={0.15} />
      </RoundedBox>

      {/* High-Fidelity Front Glass Display Digitizer Layer */}
      <mesh position={[0, 0, 0.112]} onClick={(event) => {
        event.stopPropagation();
        if (isLocked) {
          setIsLocked(false);
          return;
        }

        const { uv } = event;
        if (!uv) return;

        const cx = uv.x * 100;
        const cy = (1 - uv.y) * 100;

        const pairedAppNode = appCoords.find(node => 
          Math.abs(node.x - cx) < 14 && Math.abs(node.y - cy) < 14
        );
        
        if (pairedAppNode) onAppClick(pairedAppNode.name);
      }}>
        <planeGeometry args={[3.04, 6.24]} />
        {compositeTexture ? (
          <meshPhysicalMaterial 
            map={compositeTexture} 
            roughness={0.03} 
            metalness={0.05}
            clearcoat={1.0}
            clearcoatRoughness={0.01}
            reflectivity={1.0}
          />
        ) : (
          <meshStandardMaterial color="#020617" roughness={0.9} />
        )}
      </mesh>
    </group>
  );
}

// --- MAIN CONTROL INTERFACE APPLICATION ---
export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [extractedScreen, setExtractedScreen] = useState<string | null>(null);
  const [caseColor, setCaseColor] = useState('#0f172a');
  const [appGrid, setAppGrid] = useState<any[]>([]);
  const [activeAppName, setActiveAppName] = useState<string | null>(null);
  
  const [isLocked, setIsLocked] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [systemTime, setSystemTime] = useState('09:41');
  
  const internalVideoRef = useRef<HTMLVideoElement>(null);

  const processIncomingVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const clearWorkspaceState = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setExtractedScreen(null);
    setAppGrid([]);
    setActiveAppName(null);
  };

  const compileInteractiveDeviceTwin = async () => {
    if (!videoFile) return;
    setProcessing(true);
    setIsLocked(true);

    if (internalVideoRef.current) {
      internalVideoRef.current.currentTime = internalVideoRef.current.duration / 2.2 || 1;
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = internalVideoRef.current.videoWidth || 1080;
      captureCanvas.height = internalVideoRef.current.videoHeight || 1920;
      const drawContext = captureCanvas.getContext('2d');
      drawContext?.drawImage(internalVideoRef.current, 0, 0, captureCanvas.width, captureCanvas.height);
      setExtractedScreen(captureCanvas.toDataURL('image/jpeg', 0.95));
    }

    const multipartForm = new FormData();
    multipartForm.append('video', videoFile);

    try {
      const response = await fetch('http://localhost:5000/api/scan-video', { method: 'POST', body: multipartForm });
      const parsedData = await response.json();
      
      if (parsedData.coordinates) {
        setAppGrid(parsedData.coordinates);
        if (parsedData.caseColor) setCaseColor(parsedData.caseColor);
        if (parsedData.systemTime) setSystemTime(parsedData.systemTime);
      } else {
        alert("Could not cleanly parse operational grid matrices from video frames.");
      }
    } catch (err) {
      alert("Error pairing configurations with the video analysis framework.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row p-6 lg:p-12 items-stretch gap-8 font-sans select-none transition-all duration-1000"
         style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${caseColor}22, #020617 70%)` }}>
      
      {/* SIDE OPERATIONAL PANEL CONSOLE */}
      <div className="w-full lg:w-[440px] bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl gap-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-9 h-9 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-bold tracking-tight text-white leading-none">TwinDevice Core</h1>
              <p className="text-[10px] text-slate-500 font-medium mt-1">Status: Ambient Engine Active</p>
            </div>
          </div>

          {!videoPreview ? (
            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center cursor-pointer relative bg-slate-950/30 transition group">
              <input type="file" accept="video/*" onChange={processIncomingVideo} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <Video className="w-7 h-7 mx-auto mb-3 text-slate-500 group-hover:text-indigo-400 transition" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Intake Device Tour Video</h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-2">Record your physical device showing back texture, unlocking, and home wallpaper arrays.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-[9/16] max-h-64 mx-auto shadow-inner">
                <video ref={internalVideoRef} src={videoPreview} className="w-full h-full object-contain" controls playsInline />
                <button onClick={clearWorkspaceState} className="absolute top-2 right-2 p-1.5 bg-red-950/80 hover:bg-red-900 border border-red-800 rounded-md text-red-200 transition z-20"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>

              <button 
                onClick={compileInteractiveDeviceTwin} 
                disabled={processing}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3 rounded-xl text-xs tracking-widest uppercase transition shadow-lg flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {processing ? "Extracting Interface Layers..." : "Compile Immersive Twin"}
              </button>
            </div>
          )}

          {appGrid.length > 0 && (
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 animate-fadeIn">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Sparkles className="w-3 h-3 text-indigo-400"/> Synced Matrix Properties</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <div><p className="text-[9px] text-slate-500 font-medium">Casing Tone</p><p className="font-bold text-slate-200 text-[10px] uppercase">{caseColor}</p></div>
                </div>
                <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40 flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-700" style={{ backgroundColor: caseColor }} />
                  <div><p className="text-[9px] text-slate-500 font-medium">Clock Face</p><p className="font-bold text-slate-200 text-[10px]">{systemTime}</p></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 font-medium tracking-wide flex items-center justify-between border-t border-slate-800/60 pt-4">
          <span className="flex items-center gap-1">🔒 Local WebGL Matrix</span>
          <span>v3.0 Ambient Edition</span>
        </div>
      </div>

      {/* HIGH-GLOSS 3D GRAPHICS SIMULATOR VIEWPORT */}
      <div className="flex-1 min-h-[500px] rounded-3xl relative flex items-center justify-center overflow-hidden">
        
        {/* Dynamic Status Overlay HUD on Dashboard Layer */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-4 bg-slate-900/40 border border-slate-800/50 px-4 py-2 rounded-2xl backdrop-blur-md">
          <div className="text-xs text-slate-300 font-bold tracking-wide">{systemTime}</div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {activeAppName && (
          <div className="absolute inset-x-6 bottom-6 bg-slate-900/90 border border-slate-800 p-4 rounded-xl z-30 shadow-2xl backdrop-blur-md animate-fadeIn flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600/10 rounded-lg flex items-center justify-center text-indigo-400"><MessageSquare className="w-4 h-4"/></div>
              <div>
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-sans">Active App Environment Container</span>
                <h4 className="text-xs font-bold text-white font-sans">{activeAppName}</h4>
              </div>
            </div>
            <button onClick={() => setActiveAppName(null)} className="text-[10px] font-bold uppercase bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-md text-slate-300 transition">Close App</button>
          </div>
        )}

        {isLocked && extractedScreen && (
          <div className="absolute top-6 right-6 bg-indigo-600 text-white font-bold text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full z-20 shadow-lg border border-indigo-500 animate-pulse flex items-center gap-1">
            <Eye className="w-3 h-3"/> Click Screen to Unlock
          </div>
        )}

        <div className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            <ambientLight intensity={1.0} />
            <directionalLight position={[5, 8, 4]} intensity={1.5} />
            <pointLight position={[-4, -5, -4]} intensity={0.3} />
            
            <GlassChassisPhone 
              screenTexUrl={extractedScreen}
              caseColor={caseColor}
              appCoords={appGrid}
              systemTime={systemTime}
              onAppClick={(name) => {
                try {
                  let actx = new (window.AudioContext || (window as any).webkitAudioContext)();
                  let oscilNode = actx.createOscillator(); let soundGain = actx.createGain();
                  oscilNode.type = 'sine'; oscilNode.frequency.setValueAtTime(160, actx.currentTime);
                  soundGain.gain.setValueAtTime(0.04, actx.currentTime); soundGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.04);
                  oscilNode.connect(soundGain); soundGain.connect(actx.destination); oscilNode.start(); oscilNode.stop(actx.currentTime + 0.04);
                } catch(e){}
                setActiveAppName(name);
              }}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
            />
            
            <ContactShadows position={[0, -3.4, 0]} opacity={0.4} scale={9} blur={2.2} far={4} />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 1.7} />
          </Canvas>
        </div>
      </div>

    </div>
  );
}