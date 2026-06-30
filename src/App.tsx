import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Trash2, Cpu, Battery, Wifi, Signal, Upload, ShoppingBag, Plus, ArrowLeft, Send, User } from 'lucide-react';

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
}

function GlassChassisPhone({ screenTexUrl, caseColor, appCoords, onAppClick, isLocked, setIsLocked, systemTime }: PhoneProps) {
  const modelPivotGroup = useRef<THREE.Group>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<THREE.CanvasTexture | null>(null);
  const wallpaperImgRef = useRef<HTMLImageElement | null>(null);

  // Initialize canvas asset layers once to maximize performance
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    canvasRef.current = canvas;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    textureRef.current = tex;
  }, []);

  // Fast pre-loading for background wallpaper textures
  useEffect(() => {
    if (screenTexUrl) {
      const img = new Image();
      img.src = screenTexUrl;
      img.onload = () => { wallpaperImgRef.current = img; };
    } else {
      wallpaperImgRef.current = null;
    }
  }, [screenTexUrl]);

  useFrame((state) => {
    if (modelPivotGroup.current) {
      modelPivotGroup.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.2) * 0.03;
      modelPivotGroup.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.02;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fast Canvas Draw Pipeline
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (wallpaperImgRef.current) {
      ctx.drawImage(wallpaperImgRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, 0, canvas.width, 45);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(systemTime, 30, 30);

    if (isLocked) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText(systemTime, canvas.width / 2, 220);
      ctx.font = '16px sans-serif';
      ctx.fillText('🔒 Tap Screen to Unlock', canvas.width / 2, 850);
      ctx.textAlign = 'left';
    } else {
      appCoords.forEach(app => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect((app.x * canvas.width / 100) - 32, (app.y * canvas.height / 100) - 32, 64, 64, 14);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(app.name, (app.x * canvas.width / 100), (app.y * canvas.height / 100) + 50);
        ctx.textAlign = 'left';
      });
    }

    if (textureRef.current) textureRef.current.needsUpdate = true;
  });

  return (
    <group ref={modelPivotGroup}>
      <RoundedBox args={[3.2, 6.4, 0.2]} radius={0.32} smoothness={4}>
        <meshStandardMaterial color={caseColor} metalness={0.8} roughness={0.2} />
      </RoundedBox>

      <mesh position={[0, 0, 0.102]} onClick={(e) => {
        e.stopPropagation();
        if (isLocked) {
          setIsLocked(false);
          return;
        }
        if (!e.uv) return;
        const cx = e.uv.x * 100;
        const cy = (1 - e.uv.y) * 100;

        const target = appCoords.find(a => Math.abs(a.x - cx) < 10 && Math.abs(a.y - cy) < 10);
        if (target) onAppClick(target.name);
      }}>
        <planeGeometry args={[3.02, 6.22]} />
        {textureRef.current ? (
          <meshBasicMaterial map={textureRef.current} />
        ) : (
          <meshStandardMaterial color="#020617" />
        )}
      </mesh>
    </group>
  );
}

export default function App() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [extractedScreen, setExtractedScreen] = useState<string | null>(null);
  const [caseColor, setCaseColor] = useState('#0f172a');
  const [installedApps, setInstalledApps] = useState<string[]>(["WhatsApp", "Photos", "Camera", "App Store", "Settings"]);
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [systemTime] = useState('12:45');
  const [newMsg, setNewMsg] = useState("");
  const [customPhotos, setCustomPhotos] = useState<string[]>([]);

  const [chats, setChats] = useState<ChatMessage[]>([
    { contact: "Mom", lastMessage: "Call me when free!", time: "12:01 PM" },
    { contact: "Alex", lastMessage: "The architecture runs smoothly.", time: "10:14 AM" }
  ]);

  // Compute absolute coordinate arrays smoothly without recalculating layout steps unnecessarily
  const appGrid = useMemo(() => {
    const spaces = [{ x: 25, y: 22 }, { x: 50, y: 22 }, { x: 75, y: 22 }, { x: 25, y: 42 }, { x: 50, y: 42 }, { x: 75, y: 42 }];
    return installedApps.map((name, i) => ({
      name,
      x: spaces[i % spaces.length].x,
      y: spaces[i % spaces.length].y
    }));
  }, [installedApps]);

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
    setCaseColor('#0f172a');
    setInstalledApps(["WhatsApp", "Photos", "Camera", "App Store", "Settings"]);
  };

  const uploadAndCompileTwin = async () => {
    if (selectedFiles.length === 0) return;
    setProcessing(true);
    setIsLocked(true);

    const fd = new FormData();
    selectedFiles.forEach(f => fd.append('files', f));

    try {
      // NOTE: Swap this placeholder address string with your exact production backend Render deployment link URL.
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
      alert("Error pairing configurations with the analysis framework.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row p-6 lg:p-12 gap-8 select-none transition-all duration-750"
         style={{ backgroundImage: `radial-gradient(circle at 70% 30%, ${caseColor}20, #020617 75%)` }}>
      
      <div className="w-full lg:w-[440px] bg-slate-900/80 border border-slate-800/60 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-2xl backdrop-blur-md">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <div>
                <h1 className="text-xs font-bold uppercase tracking-wider text-white">OmniTwin Canvas</h1>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">High-Speed Engine Core</p>
              </div>
            </div>
            <button onClick={() => { clearWorkspace(); setIsLocked(false); setCaseColor('#1e1b4b'); }} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition">
              🚀 Demo Mode
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/30 rounded-2xl p-6 text-center relative bg-slate-950/20 group transition">
            <input type="file" multiple accept="video/*,image/*" onChange={handleFileSelection} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <Upload className="w-5 h-5 mx-auto mb-2 text-slate-500 group-hover:text-indigo-400 transition" />
            <span className="text-xs font-bold text-slate-300 block">Intake Configurator Manager</span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Drop screen recordings or physical phone images.</span>
          </div>

          {filePreviews.length > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2 bg-slate-950/40 p-2 border border-slate-800 rounded-xl">
                {filePreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                    <img src={src} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={clearWorkspace} className="px-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 transition"><Trash2 className="w-4 h-4"/></button>
                <button onClick={uploadAndCompileTwin} disabled={processing} className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider text-white transition">
                  {processing ? "Processing Matrix..." : "Build Virtual Twin"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-slate-500 font-medium tracking-wide">WebGL Hardware Acceleration Enabled • Ambient Phase 4.0</p>
      </div>

      <div className="flex-1 min-h-[500px] bg-slate-950/20 rounded-3xl relative flex items-center justify-center overflow-hidden p-4">
        <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center gap-4 bg-slate-900/50 border border-slate-800/40 px-3 py-1.5 rounded-xl backdrop-blur-sm text-xs font-bold text-slate-300">
          <div>{systemTime}</div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <Signal className="w-3 h-3" /><Wifi className="w-3 h-3" /><Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {activeApp && (
          <div className="absolute inset-0 bg-slate-950/95 z-30 flex flex-col border border-slate-800 rounded-3xl m-2 overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
              <button onClick={() => setActiveApp(null)} className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition"><ArrowLeft className="w-4 h-4"/></button>
              <span className="text-xs font-bold uppercase tracking-wider text-white">{activeApp}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-xs">
              {activeApp === "WhatsApp" && (
                <div className="flex flex-col h-full justify-between gap-4">
                  <div className="space-y-2 overflow-y-auto flex-1">
                    {chats.map((c, i) => (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex justify-between items-start">
                        <div><p className="font-bold text-white">{c.contact}</p><p className="text-slate-400 mt-0.5 text-[11px]">{c.lastMessage}</p></div>
                        <span className="text-[9px] text-slate-500">{c.time}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 border-t border-slate-800 pt-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} placeholder="Type a response message..." className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 text-white text-xs focus:outline-none" />
                    <button onClick={() => { if(!newMsg) return; setChats(prev => [{contact:"You", lastMessage:newMsg, time:"Just Now"}, ...prev]); setNewMsg(""); }} className="bg-emerald-600 p-2 rounded-xl text-white hover:bg-emerald-500 transition"><Send className="w-4 h-4"/></button>
                  </div>
                </div>
              )}

              {activeApp === "Photos" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Gallery Folder Storage</span>
                    <label className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer flex items-center gap-1 hover:bg-indigo-600/30 transition">
                      <Plus className="w-3 h-3"/> Add Image
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) setCustomPhotos(prev => [...prev, URL.createObjectURL(e.target.files![0])]); }} />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center text-slate-600 font-bold">Base.jpg</div>
                    {customPhotos.map((src, i) => <img key={i} src={src} alt="custom upload" className="aspect-square object-cover rounded-xl border border-slate-800 shadow-sm" />)}
                  </div>
                </div>
              )}

              {activeApp === "Camera" && (
                <div className="h-full flex flex-col items-center justify-center gap-3 bg-black rounded-xl p-6 border border-slate-900 text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 animate-spin"/>
                  <p className="font-bold text-white">Optic Lens Stream Active</p>
                </div>
              )}

              {activeApp === "App Store" && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Available Extensions</span>
                  {["Discord", "YouTube", "Spotify"].map((app, i) => {
                    const ready = installedApps.includes(app);
                    return (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                        <span className="font-bold text-white">{app}</span>
                        <button disabled={ready} onClick={() => setInstalledApps(prev => [...prev, app])} className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg transition ${ready ? 'bg-slate-800 text-slate-600' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                          {ready ? "Installed" : "Get"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeApp === "Settings" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><User className="w-4 h-4"/></div>
                    <div><p className="font-bold text-white">Owner Profile Matrix</p><p className="text-[10px] text-slate-500">Device Target: Virtual Twin v4.0</p></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="w-full h-full absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
          <Canvas camera={{ position: [0, 0, 7.0], fov: 45 }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[3, 6, 3]} intensity={1.4} />
            <GlassChassisPhone 
              screenTexUrl={extractedScreen}
              caseColor={caseColor}
              appCoords={appGrid}
              systemTime={systemTime}
              isLocked={isLocked}
              setIsLocked={setIsLocked}
              onAppClick={(name) => setActiveApp(name)}
            />
            <ContactShadows position={[0, -3.3, 0]} opacity={0.3} scale={7} blur={2.0} far={4} />
            <OrbitControls enableZoom={false} minPolarAngle={Math.PI / 3.6} maxPolarAngle={Math.PI / 1.8} />
          </Canvas>
        </div>
      </div>

    </div>
  );
}
