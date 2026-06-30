import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Trash2, Cpu, Battery, Wifi, Signal, Upload, ShoppingBag, Plus, ArrowLeft, Send, User } from 'lucide-react';

// Define explicit types for the app coordinate nodes
interface AppCoordinate {
  name: string;
  x: number;
  y: number;
}

// Define explicit types for the Chat messages
interface ChatMessage {
  contact: string;
  lastMessage: string;
  time: string;
}

// Define explicit types for the Phone component properties
interface PhoneProps {
  screenTexUrl: string | null;
  caseColor: string;
  appCoords: AppCoordinate[];
  onAppClick: (name: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  systemTime: string;
}

// --- STABLE GLASS PHYSICAL 3D SMARTPHONE COMPONENT ---
function GlassChassisPhone({ screenTexUrl, caseColor, appCoords, onAppClick, isLocked, setIsLocked, systemTime }: PhoneProps) {
  const modelPivotGroup = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [compositeTexture, setCompositeTexture] = useState<THREE.CanvasTexture | null>(null);
  const [wallpaperImage, setWallpaperImage] = useState<HTMLImageElement | null>(null);

  useFrame((state) => {
    if (modelPivotGroup.current) {
      modelPivotGroup.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.1) * 0.04;
      modelPivotGroup.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.02;
    }
    if (compositeTexture) compositeTexture.needsUpdate = true;
  });

  useEffect(() => {
    if (screenTexUrl) {
      const img = new Image();
      img.src = screenTexUrl;
      img.onload = () => setWallpaperImage(img);
    } else {
      setWallpaperImage(null);
    }
  }, [screenTexUrl]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 2220;
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (wallpaperImage) {
        ctx.drawImage(wallpaperImage, 0, 0, canvas.width, canvas.height);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1e1b4b');
        gradient.addColorStop(0.5, '#311042');
        gradient.addColorStop(1, '#020617');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, canvas.width, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px sans-serif';
      ctx.fillText(systemTime, 70, 60);

      if (isLocked) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 96px sans-serif';
        ctx.fillText(systemTime, canvas.width / 2, 480);
        ctx.font = '36px sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('🔒 Click Screen to Scan Fingerprint', canvas.width / 2, 1900);
        ctx.textAlign = 'left';
      } else {
        appCoords.forEach(app => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.beginPath();
          ctx.roundRect((app.x * canvas.width / 100) - 70, (app.y * canvas.height / 100) - 70, 140, 140, 30);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(app.name, (app.x * canvas.width / 100), (app.y * canvas.height / 100) + 110);
          ctx.textAlign = 'left';
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
      <RoundedBox args={[3.2, 6.4, 0.22]} radius={0.36} smoothness={6}>
        <meshStandardMaterial color={caseColor} metalness={0.85} roughness={0.18} />
      </RoundedBox>

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

        const tapped = appCoords.find(node => Math.abs(node.x - cx) < 12 && Math.abs(node.y - cy) < 12);
        if (tapped) onAppClick(tapped.name);
      }}>
        <planeGeometry args={[3.04, 6.24]} />
        {compositeTexture ? (
          <meshPhysicalMaterial map={compositeTexture} roughness={0.02} clearcoat={1.0} clearcoatRoughness={0.01} />
        ) : (
          <meshStandardMaterial color="#020617" />
        )}
      </mesh>
    </group>
  );
}

// --- MAIN APPLICATION PLATFORM CONTAINER ---
export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [extractedScreen, setExtractedScreen] = useState<string | null>(null);
  const [caseColor, setCaseColor] = useState('#0f172a');
  const [appGrid, setAppGrid] = useState<AppCoordinate[]>([]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [systemTime] = useState('12:45');

  const [chats, setChats] = useState<ChatMessage[]>([
    { contact: "Mom", lastMessage: "Where are you?", time: "12:01 PM" },
    { contact: "Tech Project Lead", lastMessage: "Let's push the twin live on Render", time: "10:14 AM" }
  ]);
  const [newMsg, setNewMsg] = useState("");

  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<string[]>(["WhatsApp", "Photos", "Camera", "App Store", "Settings"]);

  useEffect(() => {
    rebuildLayoutMap(installedApps);
  }, [installedApps]);

  const rebuildLayoutMap = (appsList: string[]) => {
    const positions = [
      { x: 25, y: 22 }, { x: 50, y: 22 }, { x: 75, y: 22 },
      { x: 25, y: 42 }, { x: 50, y: 42 }, { x: 75, y: 42 }
    ];
    const mapped = appsList.map((name, i) => ({
      name,
      x: positions[i % positions.length].x,
      y: positions[i % positions.length].y
    }));
    setAppGrid(mapped);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      const urls = filesArray.map(f => URL.createObjectURL(f));
      setFilePreviews(prev => [...prev, ...urls]);
    }
  };

  const clearWorkspace = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setExtractedScreen(null);
    setActiveApp(null);
    setCaseColor('#0f172a');
    setInstalledApps(["WhatsApp", "Photos", "Camera", "App Store", "Settings"]);
  };

  const launchDemoMode = () => {
    clearWorkspace();
    setIsLocked(false);
    setCaseColor('#1e1b4b');
    setExtractedScreen(null);
  };

  const uploadAndCompileTwin = async () => {
    if (selectedFiles.length === 0) return;
    setProcessing(true);
    setIsLocked(true);

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));

    try {
      const response = await fetch('https://phone-twin-backend.onrender.com/api/scan-video', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (data.coordinates) {
        setAppGrid(data.coordinates);
        if (data.caseColor) setCaseColor(data.caseColor);
        if (data.whatsappData?.recentChats) setChats(data.whatsappData.recentChats);
        
        const imgFile = selectedFiles.find(f => f.type.startsWith('image/'));
        if (imgFile) {
          setExtractedScreen(URL.createObjectURL(imgFile));
        }
        setIsLocked(false);
      }
    } catch (err) {
      alert("Error scanning files with Gemini Multimodal engine.");
    } finally {
      setProcessing(false);
    }
  };

  const playHapticTap = () => {
    try {
      const actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, actx.currentTime);
      gain.gain.setValueAtTime(0.05, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + 0.05);
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row p-6 lg:p-12 items-stretch gap-8 select-none transition-all duration-1000"
         style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${caseColor}25, #020617 75%)` }}>
      
      {/* LEFT SIDE CONSOLE PANEL */}
      <div className="w-full lg:w-[460px] bg-slate-900/70 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-2xl backdrop-blur-xl gap-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">OmniTwin Systems</h1>
                <p className="text-[10px] text-slate-500 font-medium">Multimodal AI Core v4.0</p>
              </div>
            </div>
            <button onClick={launchDemoMode} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg hover:bg-emerald-600/30 transition">
              🚀 Try Demo Mode
            </button>
          </div>

          {/* OMNI FILE UPLOAD MODULE */}
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-2xl p-6 text-center relative bg-slate-950/40 group transition">
            <input type="file" multiple accept="video/*,image/*" onChange={handleFileSelection} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400 group-hover:text-indigo-400 transition" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Intake Dashboard Configurator</h4>
            <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Drop screen recordings, outer physical mirror images, or standard screenshots together.</p>
          </div>

          {filePreviews.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-2.5 border border-slate-800 rounded-xl max-h-24 overflow-y-auto">
                {filePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden bg-black border border-slate-700">
                    <img src={src} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={clearWorkspace} className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 text-xs transition"><Trash2 className="w-4 h-4"/></button>
                <button onClick={uploadAndCompileTwin} disabled={processing} className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-bold py-3 rounded-xl text-xs uppercase tracking-widest text-white shadow-md transition">
                  {processing ? "Analyzing Multi-Channels..." : "Synthesize Smart Twin"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl text-[11px] text-slate-400 space-y-1.5">
          <p className="font-bold text-white text-[10px] tracking-wider uppercase text-indigo-400">🤖 Autonomous Intelligence Rule:</p>
          <p>The device uses active inference to predict and mimic behavior patterns. Clicking application zones sends frequency triggers to adaptive runtime pipelines.</p>
        </div>
      </div>

      {/* RIGHT SIDE 3D INTERACTIVE DEVICE INTERFACE */}
      <div className="flex-1 min-h-[560px] bg-slate-950/30 border border-slate-900 rounded-3xl relative flex items-center justify-center overflow-hidden p-4 shadow-inner">
        
        {/* TOP STATUS OVERLAY CHIPS */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl backdrop-blur-md text-xs text-slate-300 font-bold">
          <div>{systemTime}</div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Signal className="w-3.5 h-3.5" /><Wifi className="w-3.5 h-3.5" /><Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* RUNTIME APP APPLICATION WINDOW SYSTEM */}
        {activeApp && (
          <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col animate-fadeIn border-2 border-slate-800/80 rounded-3xl m-2 overflow-hidden">
            {/* Header Controls */}
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center gap-3">
              <button onClick={() => { playHapticTap(); setActiveApp(null); }} className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">{activeApp}</h3>
            </div>

            {/* Application Environment Render Routing */}
            <div className="flex-1 overflow-y-auto p-4 text-xs">
              
              {/* WHATSAPP CONTAINER MOCKING EXPERIENCE */}
              {activeApp === "WhatsApp" && (
                <div className="flex flex-col h-full justify-between">
                  <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                    {chats.map((c, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800/80 p-3 rounded-xl flex justify-between items-start hover:border-emerald-500/30 transition">
                        <div>
                          <p className="font-bold text-white text-xs">{c.contact}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{c.lastMessage}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium">{c.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-800 pt-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type simulation response..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
                    <button onClick={() => {
                      if (!newMsg) return;
                      playHapticTap();
                      setChats(prev => [{ contact: "You", lastMessage: newMsg, time: "Just Now" }, ...prev]);
                      setNewMsg("");
                    }} className="bg-emerald-600 p-2.5 rounded-xl text-white hover:bg-emerald-500 transition"><Send className="w-4 h-4"/></button>
                  </div>
                </div>
              )}

              {/* PHOTOS APPLICATION EXPERIENCE */}
              {activeApp === "Photos" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Local Device Storage Album</span>
                    <label className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1.5 hover:bg-indigo-600/30 transition">
                      <Plus className="w-3 h-3" /> Add Photo
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const url = URL.createObjectURL(e.target.files[0]);
                          setCustomPhotos(prev => [...prev, url]);
                        }
                      }} />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-gradient-to-tr from-slate-800 to-slate-900 rounded-xl border border-slate-700/60 flex items-center justify-center text-slate-500 font-bold">Sample.jpg</div>
                    {customPhotos.map((src, i) => (
                      <img key={i} src={src} alt="custom payload" className="aspect-square object-cover rounded-xl border border-slate-800 shadow-md" />
                    ))}
                  </div>
                </div>
              )}

              {/* CAMERA APPLICATION LAYER */}
              {activeApp === "Camera" && (
                <div className="h-full flex flex-col items-center justify-center gap-4 bg-black rounded-xl border border-slate-800 p-6 text-center">
                  <div className="w-20 h-20 rounded-full border-4 border-dashed border-slate-800 flex items-center justify-center text-slate-600 animate-spin" />
                  <div>
                    <h4 className="font-bold text-white text-xs">Simulated Optic Lens Ready</h4>
                    <p className="text-[10px] text-slate-500 mt-1">Camera components linked through primary pipeline matrix protocols.</p>
                  </div>
                </div>
              )}

              {/* MARKET APP STORE COMPONENT */}
              {activeApp === "App Store" && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Trending Environments</span>
                  {["Discord", "YouTube", "Spotify", "Instagram"].map((app, idx) => {
                    const isInstalled = installedApps.includes(app);
                    return (
                      <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center"><ShoppingBag className="w-4 h-4"/></div>
                          <span className="font-bold text-white">{app}</span>
                        </div>
                        <button disabled={isInstalled} onClick={() => {
                          playHapticTap();
                          setInstalledApps(prev => [...prev, app]);
                        }} className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition ${isInstalled ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                          {isInstalled ? "Installed" : "Get"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* GENERAL DEVICE SETTINGS SYSTEM */}
              {activeApp === "Settings" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><User className="w-4 h-4"/></div>
                    <div><h4 className="font-bold text-white text-xs">Simulator Owner Profile</h4><p className="text-[10px] text-slate-500">Model: Twin Device v4.0</p></div>
                  </div>
                  <div className="space-y-1">
                    <div className="bg-slate-900/60 p-3 rounded-xl flex items-center justify-between border border-slate-800/40 text-[11px]"><span className="text-slate-300">Casing Tone Matrix</span><span className="font-bold font-mono text-indigo-400 uppercase">{caseColor}</span></div>
                    <div className="bg-slate-900/60 p-3 rounded-xl flex items-center justify-between border border-slate-800/40 text-[11px]"><span className="text-slate-300">Active Architecture</span><span className="font-bold text-slate-400">WebGL Core Standard</span></div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* 3D GRAPHICS RENDER PORT */}
        <div className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 0, 7.2], fov: 45 }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[4, 7, 3]} intensity={1.5} />
            <GlassChassisPhone 
              screenTexUrl={extractedScreen}
              caseColor={caseColor}
              appCoords={appGrid}
              systemTime={systemTime}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
              onAppClick={(name) => {
                playHapticTap();
                setActiveApp(name);
              }}
            />
            <ContactShadows position={[0, -3.3, 0]} opacity={0.35} scale={8} blur={2.0} far={4} />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3.8} maxPolarAngle={Math.PI / 1.8} />
          </Canvas>
        </div>
      </div>

    </div>
  );
}
