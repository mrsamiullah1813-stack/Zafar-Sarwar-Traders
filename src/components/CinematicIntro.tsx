import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, Volume2, VolumeX, ShieldCheck, Droplets } from 'lucide-react';
import * as THREE from 'three';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'loading' | 'particles' | 'assembling' | 'glowing' | 'tagline' | 'zoomout' | 'finished'>('loading');
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Web Audio Synth ambient luxury chime for cinematic intro
  const playAmbientSound = (freq = 220, duration = 2.5) => {
    if (muted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (err) {
      console.warn('Audio play restricted:', err);
    }
  };

  // Timeline Sequence & Asset Preload Progress
  useEffect(() => {
    // Smooth progress loader simulation (0 to 100%)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const timer1 = setTimeout(() => {
      setPhase('particles');
      playAmbientSound(293.66, 3.5); // D4 note
    }, 600);

    const timer2 = setTimeout(() => {
      setPhase('assembling');
      playAmbientSound(440.00, 3.0); // A4 note
    }, 2200);

    const timer3 = setTimeout(() => {
      setPhase('glowing');
      playAmbientSound(554.37, 3.0); // C#5 note
    }, 4800);

    const timer4 = setTimeout(() => {
      setPhase('tagline');
      playAmbientSound(659.25, 3.5); // E5 note
    }, 7200);

    const timer5 = setTimeout(() => {
      setPhase('zoomout');
    }, 9200);

    const timer6 = setTimeout(() => {
      setPhase('finished');
      onComplete();
    }, 10400);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [onComplete]);

  // Three.js 3D Sanitaryware WebGL Scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 16);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch (err) {
      console.warn('WebGL initialization failed or unsupported in browser:', err);
      return;
    }

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 2.0);
    scene.add(ambientLight);

    const pointLightBlue = new THREE.PointLight(0x38bdf8, 5, 35);
    pointLightBlue.position.set(6, 6, 8);
    scene.add(pointLightBlue);

    const pointLightGold = new THREE.PointLight(0xf59e0b, 4, 35);
    pointLightGold.position.set(-6, -4, 6);
    scene.add(pointLightGold);

    // Water Droplet & Lighting Particles Group
    const particleCount = 250;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 32;
      particlePositions[i + 1] = (Math.random() - 0.5) * 32;
      particlePositions[i + 2] = (Math.random() - 0.5) * 32;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 3D Sanitaryware Floating Assemblies Group
    const sanitaryGroup = new THREE.Group();
    scene.add(sanitaryGroup);

    // Materials: Gold, Chrome, Porcelain Ceramic, Matte Obsidian
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.95, roughness: 0.15 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.98, roughness: 0.05 });
    const ceramicMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1 });
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.4, roughness: 0.3 });

    const sanitaryObjects: { mesh: THREE.Group; targetPos: THREE.Vector3; initialPos: THREE.Vector3; rotSpeed: THREE.Vector3 }[] = [];

    // 1. Luxury Faucet Mesh
    const faucetGroup = new THREE.Group();
    const fBase = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.4, 32), goldMat);
    fBase.position.y = -0.8;
    faucetGroup.add(fBase);
    const fCol = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 2.0, 32), goldMat);
    fCol.position.y = 0.2;
    faucetGroup.add(fCol);
    const fSpout = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.16, 16, 50, Math.PI * 0.7), goldMat);
    fSpout.position.set(0.4, 1.2, 0);
    fSpout.rotation.z = -Math.PI / 4;
    faucetGroup.add(fSpout);

    // 2. Rain Shower Disk Mesh
    const showerGroup = new THREE.Group();
    const sPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.5, 32), chromeMat);
    showerGroup.add(sPole);
    const sDisk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.12, 48), chromeMat);
    sDisk.position.set(0.5, 1.2, 0);
    showerGroup.add(sDisk);

    // 3. Ceramic Wash Basin Bowl Mesh
    const basinGroup = new THREE.Group();
    const bBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 0.8, 0.8, 48, 1, true), ceramicMat);
    basinGroup.add(bBowl);
    const bBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.1, 48), ceramicMat);
    bBottom.position.y = -0.4;
    basinGroup.add(bBottom);

    // 4. Heavy Pressure Pipe Fitting Mesh
    const pipeGroup = new THREE.Group();
    const pTube = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.8, 32), pipeMat);
    pipeGroup.add(pTube);
    const pRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 16, 32), chromeMat);
    pRing.position.y = 1.0;
    pipeGroup.add(pRing);

    const items = [
      { grp: faucetGroup, target: new THREE.Vector3(-4.5, 1.8, 0) },
      { grp: showerGroup, target: new THREE.Vector3(4.5, 2.2, -1) },
      { grp: basinGroup, target: new THREE.Vector3(-4.2, -2.5, 1) },
      { grp: pipeGroup, target: new THREE.Vector3(4.2, -2.2, -0.5) },
    ];

    items.forEach(({ grp, target }) => {
      const initialPos = new THREE.Vector3(
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 24
      );
      grp.position.copy(initialPos);
      grp.scale.setScalar(0.75);
      sanitaryGroup.add(grp);

      sanitaryObjects.push({
        mesh: grp,
        targetPos: target,
        initialPos,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          Math.random() * 0.02 + 0.01,
          (Math.random() - 0.5) * 0.01
        )
      });
    });

    // Central Holographic Water Ring
    const ringGeo = new THREE.TorusGeometry(3.6, 0.06, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.5 });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    scene.add(ringMesh);

    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate Ring & Particles
      ringMesh.rotation.z = elapsedTime * 0.4;
      ringMesh.rotation.x = Math.sin(elapsedTime * 0.3) * 0.25;
      particleSystem.rotation.y = elapsedTime * 0.06;

      // Animate 3D Objects Assembly
      sanitaryObjects.forEach(({ mesh, targetPos, initialPos, rotSpeed }) => {
        const factor = Math.min(1, Math.max(0, (elapsedTime - 1.2) / 3.0));
        mesh.position.lerpVectors(initialPos, targetPos, factor);
        mesh.rotation.x += rotSpeed.x;
        mesh.rotation.y += rotSpeed.y;
        mesh.rotation.z += rotSpeed.z;
      });

      // Camera Fly-Through on Zoomout phase
      if (elapsedTime > 8.5) {
        camera.position.z -= 0.18;
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  const handleSkip = () => {
    setPhase('finished');
    onComplete();
  };

  if (phase === 'finished') return null;

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
        phase === 'zoomout' ? 'opacity-0 scale-125 blur-md pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* 3D WebGL Canvas Stage */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* Radial Lighting & Ambient Fog Overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950/80 to-slate-950 pointer-events-none z-10" />
      
      {/* Lens Flare Water Ripple Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/25 via-amber-400/20 to-cyan-400/25 rounded-full blur-[140px] pointer-events-none z-10 animate-pulse-slow" />

      {/* Control Buttons (Skip & Sound) */}
      <div className="absolute top-8 right-8 z-50 flex items-center gap-3">
        <button
          onClick={() => setMuted(!muted)}
          className="p-2.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-amber-400 hover:border-amber-400 text-xs backdrop-blur-md transition-all shadow-xl cursor-pointer"
          title={muted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />}
        </button>

        <button
          onClick={handleSkip}
          className="px-4 py-2 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white hover:border-blue-400 text-xs font-semibold tracking-wider flex items-center gap-2 backdrop-blur-md transition-all shadow-xl group cursor-pointer"
        >
          <span>Skip Experience</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Main Visual Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-4xl">
        
        {/* Holographic Metal Shield Badge */}
        <div className={`relative mb-8 transition-all duration-1000 transform ${
          phase === 'loading' ? 'scale-50 opacity-0 blur-md' : 'scale-100 opacity-100 blur-0'
        }`}>
          <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-blue-600 via-amber-400 to-cyan-400 p-[2px] shadow-[0_0_80px_rgba(59,130,246,0.6)] relative group">
            <div className="w-full h-full bg-slate-950/90 backdrop-blur-md rounded-[22px] flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />

              <span className="font-serif font-black text-3xl sm:text-4xl tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-amber-200 to-cyan-200 filter drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]">
                ZT
              </span>
              <span className="text-[9px] font-mono tracking-widest text-blue-400 uppercase mt-1">EST. LUXURY</span>
            </div>
          </div>
        </div>

        {/* Brand Headline & Tagline */}
        <div className="space-y-4">
          <h1 className={`text-4xl sm:text-6xl md:text-7xl font-black font-serif tracking-tight text-white transition-all duration-1000 transform ${
            phase === 'assembling' || phase === 'glowing' || phase === 'tagline' || phase === 'zoomout'
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-8 scale-95'
          }`}>
            ZAFAR SARWAR <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-amber-400 to-cyan-400">TRADERS</span>
          </h1>

          <div className={`transition-all duration-1000 delay-300 transform ${
            phase === 'tagline' || phase === 'zoomout' || phase === 'glowing'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}>
            <p className="text-sm sm:text-lg font-light text-slate-300 tracking-widest uppercase flex items-center justify-center gap-3">
              <span className="w-10 h-[1px] bg-gradient-to-r from-transparent to-amber-400" />
              <Droplets className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Premium Sanitary & Bath Solutions</span>
              <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="w-10 h-[1px] bg-gradient-to-l from-transparent to-cyan-400" />
            </p>

            <p className="mt-3 text-xs sm:text-sm text-slate-300 font-serif italic tracking-wide">
              "Welcome to a World of Quality, Innovation & Luxury."
            </p>
          </div>
        </div>

        {/* Asset Loading & Progress Bar */}
        <div className="mt-10 w-64 sm:w-80 space-y-2">
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden p-[1px] border border-slate-800 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 via-amber-400 to-cyan-400 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tracking-widest uppercase">
            <span>Preloading Showroom</span>
            <span>{progress}%</span>
          </div>
        </div>

      </div>

    </div>
  );
};
