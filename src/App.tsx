import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Trash2, Cpu, Battery, Wifi, Signal, Upload, Plus, ArrowLeft, Send, Search, Sliders, Smartphone, Save, Globe } from 'lucide-react';

interface AppCoordinate {
  name: string;
  x: number;
  y: number;
}

interface ChatMessage {
  contact: string;
  lastMessage: string;
  time: string;
}

interface PhoneProps {
  screenTexUrl: string | null;
  caseColor: string;
  appCoords: AppCoordinate[];
  onAppClick: (name: string) => void;
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  systemTime: string;
  phoneScale: number;
}

// --- PREMIUM HARDWARE RENDERING SUBSYSTEM ---
function FlagshipChassisPhone({ screenTexUrl, caseColor, appCoords, onAppClick, isLocked, setIsLocked, systemTime, phoneScale }: PhoneProps) {
  const modelPivotGroup = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const wallpaperImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    textureRef.current = tex;
  }, []);

  useEffect(() => {
    if (screenTexUrl) {
      const img = new Image();
      img.src = screenTexUrl;
      img.crossOrigin = "anonymous";
      img.onload = () => { wallpaperImgRef.current = img; };
    } else {
      wallpaperImgRef.current = null;
    }
  }, [screenTexUrl]);

  useFrame((state) => {
    if (modelPivotGroup.current) {
      modelPivotGroup.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.0) * 0.02;
      modelPivotGroup.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.15) * 0.01;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Premium UI Canvas Paint Loop
    if (wallpaperImgRef.current) {
      ctx.drawImage(wallpaperImgRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#0f172a');
      gradient.addColorStop(0.5, '#1e1b4b');
      gradient.addColorStop(1, '#020617');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Top Status Tray Surface
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, canvas.width, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(systemTime, 60, 42);

    if (isLocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 72px sans-serif';
      ctx.fillText(systemTime, canvas.width / 2, 380);
      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('⚡ Scan Screen To Unlock', canvas.width / 2, 1800);
      ctx.textAlign = 'left';
    } else {
      // Draw Application Launcher Node Tree
      appCoords.forEach(app => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.roundRect((app.x * canvas.width / 100) - 55, (app.y * canvas.height / 100) - 55, 110, 110, 24);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(app.name.substring(0, 11), (app.x * canvas.width / 100), (app.y * canvas.height / 100) + 85);
        ctx.textAlign = 'left';
      });
    }

    if (textureRef.current) textureRef.current.needsUpdate = true;
  });

  return (
    <group ref={modelPivotGroup} scale={[phoneScale, phoneScale, phoneScale]}>
      {/* Outer Metallic Frame Bezels */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.25, 6.45, 0.18]} />
        <meshStandardMaterial color={caseColor} metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Screen Interface Board */}
      <mesh position={[0, 0, 0.092]} onClick={(e) => {
        e.stopPropagation();
        if (isLocked) {
          setIsLocked(false);
          return;
        }
        if (!e.uv) return;
        const cx = e.uv.x * 100;
        const cy = (1 - e.uv.y) * 100;

        const target = appCoords.find(a => Math.abs(a.x - cx) < 12 && Math.abs(a.y - cy) < 12);
        if (target) onAppClick(target.name);
      }}>
        <planeGeometry args={[3.12, 6.32]} />
        {textureRef.current ? (
          <meshBasicMaterial map={textureRef.current} />
        ) : (
          <meshStandardMaterial color="#020617" />
        )}
      </mesh>

      {/* Flagship Punch-Hole Camera Module */}
      <mesh position={[0, 2.95, 0.095]}>
        <circleGeometry args={[0.06, 32]} />
        <meshStandardMaterial color="#000000" roughness={0.05} metalness={0.9} />
      </mesh>
    </group>
  );
}

// --- CORE SYSTEM LAYER MANAGER ---
export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [extractedScreen, setExtractedScreen] = useState<string | null>(null);
  const [caseColor, setCaseColor] = useState('#1e293b');
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [systemTime] = useState('12:45');
  const [newMsg, setNewMsg] = useState("");
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);
  const [customWallpaperInput, setCustomWallpaperInput] = useState("");

  // Play Store Simulation Framework States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  // System Configuration Scales
  const [phoneScale, setPhoneScale] = useState(1.0);

  const [installedApps, setInstalledApps] = useState<string[]>(
    JSON.parse(localStorage.getItem('OMNITWIN_APPS') || '["WhatsApp", "Photos", "Camera", "Play Store", "Chrome", "Google Search", "Settings"]')
  );

  const [chats, setChats] = useState<ChatMessage[]>([
    { contact: "Tech Advisor", lastMessage: "Flagship Android core engine initialized successfully.", time: "12:01 PM" },
    { contact: "Project Matrix", lastMessage: "The WebGL viewport matches standard device ratios perfectly.", time: "10:14 AM" }
  ]);

  const appGrid = useMemo(() => {
    const spaces = [
      { x: 20, y: 18 }, { x: 50, y: 18 }, { x: 80, y: 18 },
      { x: 20, y: 38 }, { x: 50, y: 38 }, { x: 80, y: 38 },
      { x: 50, y: 58 }
    ];
    return installedApps.map((name, i) => ({
      name,
      x: spaces[i % spaces.length].x,
      y: spaces[i % spaces.length].y
    }));
  }, [installedApps]);

  const persistDeviceLayout = () => {
    localStorage.setItem('OMNITWIN_APPS', JSON.stringify(installedApps));
    alert("System configuration layers pushed securely to local storage memory.");
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const arr = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...arr]);
      setFilePreviews(prev => [...prev, ...arr.map(f => URL.createObjectURL(f))]);
    }
  };

  const clearWorkspace = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    setExtractedScreen(null);
    setActiveApp(null);
    setCaseColor('#1e293b');
    setInstalledApps(["WhatsApp", "Photos", "Camera", "Play Store", "Chrome", "Google Search", "Settings"]);
  };

  const uploadAndCompileTwin = async () => {
    if (selectedFiles.length === 0) return;
    setProcessing(true);
    setIsLocked(true);

    const fd = new FormData();
    selectedFiles.forEach(f => fd.append('files', f));

    try {
      const res = await fetch('https://phone-twin-backend.onrender.com/api/scan-video', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.coordinates) {
        if (data.caseColor) setCaseColor(data.caseColor);
        if (data.whatsappData?.recentChats) setChats(data.whatsappData.recentChats);
        const img = selectedFiles.find(f => f.type.startsWith('image/'));
        if (img) setExtractedScreen(URL.createObjectURL(img));
        setIsLocked(false);
      }
    } catch (err) {
      alert("Multimodal alignment processing exception caught.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col xl:flex-row p-4 xl:p-8 gap-6 select-none transition-all duration-750 font-sans"
         style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${caseColor}25, #020617 85%)` }}>
      
      {/* CONTROL DASHBOARD PANEL */}
      <div className="w-full xl:w-[450px] bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-indigo-400" />
              <div>
                <h1 className="text-sm font-black tracking-wider text-white uppercase">OmniTwin Premium</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Flagship Operating Layer</p>
              </div>
            </div>
            <button onClick={() => { clearWorkspace(); setIsLocked(false); setCaseColor('#2563eb'); }} className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl hover:bg-indigo-600/20 transition">
              🚀 Standard Demo
            </button>
          </div>

          {/* VIEWPORT CONTROLLERS */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Interactive Viewport Parameters</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-slate-500">
                <span>ZOOM MAGNIFICATION SCALE</span>
                <span className="text-indigo-400 font-mono">{(phoneScale * 100).toFixed(0)}%</span>
              </div>
              <input type="range" min="0.5" max="1.6" step="0.05" value={phoneScale} onChange={(e) => setPhoneScale(parseFloat(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
            </div>
          </div>

          <div className="border border-dashed border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-center relative bg-slate-950/30 group transition">
            <input type="file" multiple accept="video/*,image/*" onChange={handleFileSelection} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <Upload className="w-5 h-5 mx-auto mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
            <span className="text-xs font-bold text-slate-200 block">Intake Configurator Layer</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">AI automations process lock screens, home screens, and layouts.</span>
          </div>

          {filePreviews.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 bg-slate-950/40 p-2 border border-slate-800 rounded-xl">
                {filePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800"><img src={src} alt="payload asset" className="w-full h-full object-cover" /></div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={clearWorkspace} className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition"><Trash2 className="w-4 h-4"/></button>
                <button onClick={uploadAndCompileTwin} disabled={processing} className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-black py-2.5 rounded-xl text-xs uppercase tracking-wider text-white transition shadow-lg">
                  {processing ? "Synthesizing Layers..." : "Build Virtual Twin"}
                </button>
              </div>
            </div>
          )}
        </div>

        <button onClick={persistDeviceLayout} className="w-full bg-slate-950 hover:bg-black border border-slate-800 hover:border-indigo-500/40 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-300 transition">
          <Save className="w-4 h-4 text-indigo-400" />
          <span>Save Current Device Configuration</span>
        </button>
      </div>

      {/* WEBGL HARDWARE INTERACTIVE VIEWPORT */}
      <div className="flex-1 min-h-[600px] bg-slate-950/40 rounded-3xl relative flex items-center justify-center border border-slate-900 shadow-inner overflow-hidden p-4">
        
        {/* VIEWPORT OVERLAY GLASS BADGE */}
        <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-4 bg-slate-900/60 border border-slate-800/50 px-4 py-2 rounded-xl backdrop-blur-md text-xs font-black text-slate-300">
          <div>{systemTime}</div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Signal className="w-3.5 h-3.5" /><Wifi className="w-3.5 h-3.5" /><Battery className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* APPLICATION WINDOW CONTAINER LAYER */}
        {activeApp && (
          <div className="absolute inset-0 bg-slate-950/98 z-30 flex flex-col border border-slate-800 rounded-3xl m-3 overflow-hidden animate-fadeIn shadow-2xl">
            <div className="bg-slate-900/95 border-b border-slate-800 px-5 py-3.5 flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveApp(null)} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"><ArrowLeft className="w-4 h-4"/></button>
                <span className="text-xs font-black uppercase tracking-widest text-white">{activeApp}</span>
              </div>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 px-2 py-0.5 rounded-md">EMULATOR LIVE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {activeApp === "WhatsApp" && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1">
                    {chats.map((c, i) => (
                      <div key={i} className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-xl flex justify-between items-start">
                        <div><p className="font-bold text-white text-xs">{c.contact}</p><p className="text-slate-400 mt-1 text-[11px] font-medium leading-relaxed">{c.lastMessage}</p></div>
                        <span className="text-[9px] text-slate-500 font-bold">{c.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-800/60 pt-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type encryption response..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 text-white text-xs focus:outline-none focus:border-indigo-500 transition" />
                    <button onClick={() => { if(!newMsg) return; setChats(prev => [{contact:"You", lastMessage:newMsg, time:"Just Now"}, ...prev]); setNewMsg(""); }} className="bg-indigo-600 p-2.5 rounded-xl text-white hover:bg-indigo-500 transition shadow-md"><Send className="w-4 h-4"/></button>
                  </div>
                </div>
              )}

              {activeApp === "Photos" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Device Gallery Matrix</span>
                    <label className="bg-indigo-600 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wide cursor-pointer flex items-center gap-1.5 hover:bg-indigo-500 transition shadow-md">
                      <Plus className="w-3 h-3"/> Add Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setCustomPhotos(prev => [...prev, URL.createObjectURL(e.target.files![0])]); }} />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="aspect-square bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-600 font-bold tracking-wider text-[10px] uppercase">Default.png</div>
                    {customPhotos.map((src, i) => <img key={i} src={src} alt="custom payload" className="aspect-square object-cover rounded-2xl border border-slate-800 shadow-md" />)}
                  </div>
                </div>
              )}

              {activeApp === "Play Store" && (
                <div className="max-w-md mx-auto space-y-6 py-4">
                  {!isLoggedIn ? (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                      <div className="text-center space-y-1">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Google Authentication</h3>
                        <p className="text-[10px] text-slate-500">Sign in to access ecosystem packages</p>
                      </div>
                      <div className="space-y-3">
                        <input type="text" placeholder="Google Account Email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                        <input type="password" placeholder="Account Token Password" value={pass} onChange={(e)=>setPass(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500" />
                      </div>
                      <button onClick={()=>setIsLoggedIn(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg">Sign In Verification</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-slate-300 text-[11px] truncate max-w-[200px]">Active Node: {email || "developer@google.com"}</span>
                        <button onClick={()=>setIsLoggedIn(false)} className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Disconnect</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {["GeForce NOW", "Call of Duty Warzone", "Microsoft Edge", "Termux Architecture"].map((app, idx) => (
                          <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                            <span className="font-bold text-white text-xs">{app}</span>
                            <button onClick={() => { if(!installedApps.includes(app)) setInstalledApps(prev=>[...prev, app]); }} className="bg-indigo-600 text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition">Get App</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeApp === "Chrome" && (
                <div className="space-y-4 h-full flex flex-col">
                  <div className="bg-slate-900 p-2.5 border border-slate-800 rounded-xl flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-500" />
                    <input type="text" defaultValue="https://www.google.com" className="bg-transparent text-xs text-slate-200 flex-1 outline-none font-medium" />
                  </div>
                  <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                    {/* Clean SVG replacement for Chrome logo */}
                    <svg className="w-12 h-12 mb-3 text-indigo-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="4" />
                      <line x1="21.17" y1="8" x2="12" y2="8" />
                      <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
                      <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
                    </svg>
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Chromium Render Stack Online</h4>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">Network sandbox execution frame isolated successfully.</p>
                  </div>
                </div>
              )}

              {activeApp === "Google Search" && (
                <div className="max-w-md mx-auto space-y-6 pt-4">
                  <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-3 items-center gap-3 shadow-md focus-within:border-indigo-500/50 transition">
                    <Search className="w-4 h-4 text-indigo-400" />
                    <input type="text" placeholder="Search the web database..." className="bg-transparent border-none outline-none text-xs text-white flex-1" />
                  </div>
                </div>
              )}

              {activeApp === "Camera" && (
                <div className="h-full flex flex-col items-center justify-center gap-3 bg-black rounded-2xl p-8 border border-slate-900 text-center">
                  <div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-500/40 animate-spin"/>
                  <p className="font-black text-white uppercase tracking-widest text-[11px] text-indigo-400 mt-2">Optic Matrix Stream Active</p>
                </div>
              )}

              {activeApp === "Settings" && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600/10 border border-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400"><Smartphone className="w-4 h-4"/></div>
                    <div><p className="font-bold text-white">Flagship Virtual Device</p><p className="text-[10px] text-slate-500">Model Configuration: SM-X900 Enterprise</p></div>
                  </div>
                  <div className="space-y-2 bg-slate-950/60 p-4 border border-slate-800/60 rounded-xl">
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Injected Desktop Wallpaper Address Link</label>
                    <div className="flex gap-2">
                      <input type="text" placeholder="https://images.unsplash.com/..." value={customWallpaperInput} onChange={(e)=>setCustomWallpaperInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none" />
                      <button onClick={()=>{ if(customWallpaperInput) setExtractedScreen(customWallpaperInput); }} className="bg-indigo-600 text-white font-bold text-xs px-4 rounded-xl hover:bg-indigo-500 transition">Apply</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3D WEBGL DEVICE VIEWPORT ENGINE */}
        <div className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 0, 7.5], fov: 45 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[4, 8, 4]} intensity={1.8} />
            <FlagshipChassisPhone 
              screenTexUrl={extractedScreen}
              caseColor={caseColor}
              appCoords={appGrid}
              systemTime={systemTime}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
              onAppClick={(name) => setActiveApp(name)}
              phoneScale={phoneScale}
            />
            <ContactShadows position={[0, -3.4, 0]} opacity={0.4} scale={9} blur={2.2} far={5} />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3.6} maxPolarAngle={Math.PI / 1.8} />
          </Canvas>
        </div>
      </div>

    </div>
  );
}
