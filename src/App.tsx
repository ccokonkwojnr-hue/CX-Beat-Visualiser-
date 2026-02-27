/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Pause, Square, Download, Maximize, Minimize } from 'lucide-react';
import { AppSettings, ImageSettings, Platform } from './lib/types';
import { AudioAnalyzer } from './lib/audioAnalyzer';
import { ImageManager } from './lib/imageManager';
import { FrameTemplate, PLATFORMS } from './lib/frameTemplates';
import { VideoExporter } from './lib/videoExporter';
import { BatchExporter } from './lib/batchExporter';
import { WaveformStyler } from './lib/waveformStyles';
import { ParticleSystem } from './lib/particleSystem';
import { UndoRedoManager } from './lib/undoRedoManager';
import { MetadataManager } from './lib/metadataManager';
import { CustomizationPanel } from './components/CustomizationPanel';
import { ImageControls } from './components/ImageControls';

const DEFAULT_SETTINGS: AppSettings = {
  primaryColor: '#FFA500',
  secondaryColor: '#FF4500',
  bgColor: '#050505',
  waveformStyle: 'BARS',
  mirrorWaveform: false,
  multipleWaveforms: 1,
  stereoMode: false,
  waveformScale: 1.0,
  waveformOffsetX: 0,
  waveformOffsetY: 0,
  sensitivity: 1.0,
  decayTime: 0.3,
  barCount: 40,
  circularRotation: true,
  rotationSpeed: 1.0,
  rotationDirection: 'CW',
  showMetadata: true,
  songName: 'Unknown Song',
  artistName: 'Unknown Artist',
  metadataFontSize: 36,
  metadataPosition: 'BL',
  metadataFont: '"Inter", sans-serif',
  imageBounce: false,
  imageBounceIntensity: 1.0,
  particles: false,
  duration: 15,
  frameRate: 30,
  platform: 'YOUTUBE',
  batchPlatforms: [],
  glowEffect: true,
};

const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  file: null,
  url: null,
  x: 0,
  y: 0,
  scale: 1.0,
  rotation: 0,
  shadow: true,
};

export default function App() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fileName, setFileName] = useState<string>('NO_FILE_LOADED');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<AppSettings>(settings);
  const [imageSettings, setImageSettings] = useState<ImageSettings>(DEFAULT_IMAGE_SETTINGS);
  
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [exportProgress, setExportProgress] = useState<{ progress: number; status: string } | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const threeContainerRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<number>(0);
  
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const imageManagerRef = useRef<ImageManager>(new ImageManager(imageSettings));
  const videoExporterRef = useRef<VideoExporter>(new VideoExporter());
  const batchExporterRef = useRef<BatchExporter>(new BatchExporter());
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem());
  const undoRedoManagerRef = useRef<UndoRedoManager>(new UndoRedoManager(DEFAULT_SETTINGS, DEFAULT_IMAGE_SETTINGS));
  
  const smoothedBarsRef = useRef<Float32Array[]>([]);
  const beatGlowRef = useRef<number>(0);
  const rotationAngleRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    imageManagerRef.current.updateSettings(imageSettings);
  }, [imageSettings]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    
    const handleUndoRedo = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('keydown', handleUndoRedo);
    
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('keydown', handleUndoRedo);
    };
  }, []);

  const handleSettingsChange = (newSettings: AppSettings) => {
    setSettings(newSettings);
    undoRedoManagerRef.current.pushState(newSettings, imageSettings);
    updateUndoRedoState();
  };

  const handleImageSettingsChange = (newImageSettings: ImageSettings) => {
    setImageSettings(newImageSettings);
    undoRedoManagerRef.current.pushState(settings, newImageSettings);
    updateUndoRedoState();
  };

  const handleUndo = () => {
    const state = undoRedoManagerRef.current.undo();
    if (state) {
      setSettings(state.appSettings);
      setImageSettings(state.imageSettings);
      updateUndoRedoState();
    }
  };

  const handleRedo = () => {
    const state = undoRedoManagerRef.current.redo();
    if (state) {
      setSettings(state.appSettings);
      setImageSettings(state.imageSettings);
      updateUndoRedoState();
    }
  };

  const updateUndoRedoState = () => {
    setCanUndo(undoRedoManagerRef.current.canUndo());
    setCanRedo(undoRedoManagerRef.current.canRedo());
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioUrl(url);
      setFileName(file.name.toUpperCase());
      setIsPlaying(false);
      
      try {
        const metadata = await MetadataManager.extractMetadata(file);
        const newSettings = { ...settings, songName: metadata.title, artistName: metadata.artist };
        setSettings(newSettings);
        undoRedoManagerRef.current.pushState(newSettings, imageSettings);
        updateUndoRedoState();
      } catch (err) {
        console.error("Failed to extract metadata", err);
      }
    }
  };

  const togglePlay = async () => {
    if (!audioUrl || !audioRef.current) return;

    if (!analyzerRef.current) {
      analyzerRef.current = new AudioAnalyzer();
    }

    analyzerRef.current.connect(audioRef.current);
    await analyzerRef.current.resume();

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => {
      setIsPlaying(true);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderFrame();
    };
    const onPause = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    };
    const onEnded = () => {
      setIsPlaying(false);
      cancelAnimationFrame(animationRef.current);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl, settings, imageSettings]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const renderFrame = () => {
    if (!analyzerRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentSettings = settingsRef.current;
    const template = FrameTemplate.getTemplate(currentSettings.platform);
    
    // Resize canvas if needed
    if (canvas.width !== template.width || canvas.height !== template.height) {
      canvas.width = template.width;
      canvas.height = template.height;
      if (currentSettings.is3D) {
        threeVisualizerRef.current.resize(template.width, template.height);
      }
    }

    // Clear background
    ctx.fillStyle = currentSettings.bgColor;
    ctx.fillRect(0, 0, template.width, template.height);

    // Update frequency data
    analyzerRef.current.getFrequencyData('MAIN');
    if (currentSettings.stereoMode) {
      analyzerRef.current.getFrequencyData('LEFT');
      analyzerRef.current.getFrequencyData('RIGHT');
    }

    // Audio Analysis
    const bands = analyzerRef.current.getFrequencyBands();
    const isKick = analyzerRef.current.detectKick(bands.kick, currentSettings.sensitivity);
    const isBass = analyzerRef.current.detectBass(bands.bass, currentSettings.sensitivity);
    const snareIntensity = analyzerRef.current.detectSnare(bands.snare, currentSettings.sensitivity);

    if (isKick || isBass || snareIntensity > 0.5) {
      beatGlowRef.current = 1.0;
    } else {
      beatGlowRef.current = Math.max(0, beatGlowRef.current - (1 / (currentSettings.decayTime * 60)));
    }

    // Draw Image Overlay
    let bounceScale = 1.0;
    if (currentSettings.imageBounce) {
      // Add snare intensity to the bounce scale for extra responsiveness
      const totalBounce = beatGlowRef.current + (snareIntensity * 0.5);
      bounceScale = 1.0 + (totalBounce * 0.1 * currentSettings.imageBounceIntensity);
    }
    imageManagerRef.current.overlayImage(ctx, template.width, template.height, bounceScale);

    timeRef.current += 1;
    if (currentSettings.circularRotation) {
      const speed = currentSettings.rotationDirection === 'CW' ? currentSettings.rotationSpeed : -currentSettings.rotationSpeed;
      rotationAngleRef.current += (speed * 0.01) + (beatGlowRef.current * speed * 0.05);
    }

    // Get Frequency Data
    let rawBars: Float32Array;
    let rawBarsRight: Float32Array | null = null;

    if (currentSettings.stereoMode) {
      rawBars = analyzerRef.current.getLogarithmicBands(currentSettings.barCount, 'LEFT');
      rawBarsRight = analyzerRef.current.getLogarithmicBands(currentSettings.barCount, 'RIGHT');
    } else {
      rawBars = analyzerRef.current.getLogarithmicBands(currentSettings.barCount, 'MAIN');
    }

    // Initialize smoothing arrays
    if (smoothedBarsRef.current.length === 0 || smoothedBarsRef.current[0].length !== currentSettings.barCount) {
      smoothedBarsRef.current = [];
      for (let i = 0; i < Math.max(10, currentSettings.multipleWaveforms * 2); i++) {
        smoothedBarsRef.current.push(new Float32Array(currentSettings.barCount));
      }
    } else {
      while (smoothedBarsRef.current.length < currentSettings.multipleWaveforms * 2) {
        smoothedBarsRef.current.push(new Float32Array(currentSettings.barCount));
      }
    }

    // Smooth data
    const smoothFactor = 1.0 - (currentSettings.decayTime * 0.9);
    
    // Shift history for trailing effect
    for (let i = currentSettings.multipleWaveforms - 1; i > 0; i--) {
      smoothedBarsRef.current[i].set(smoothedBarsRef.current[i - 1]);
      if (currentSettings.stereoMode) {
        smoothedBarsRef.current[i + currentSettings.multipleWaveforms].set(smoothedBarsRef.current[i - 1 + currentSettings.multipleWaveforms]);
      }
    }

    // Update current frame
    for (let i = 0; i < currentSettings.barCount; i++) {
      smoothedBarsRef.current[0][i] += (rawBars[i] - smoothedBarsRef.current[0][i]) * smoothFactor;
      if (currentSettings.stereoMode && rawBarsRight) {
        smoothedBarsRef.current[currentSettings.multipleWaveforms][i] += (rawBarsRight[i] - smoothedBarsRef.current[currentSettings.multipleWaveforms][i]) * smoothFactor;
      }
    }

    // Draw 2D Waveform
    const drawWaveformLayer = (data: Float32Array, color: string, alpha: number, isRightChannel: boolean = false) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (currentSettings.glowEffect) {
        ctx.shadowBlur = 20 + (beatGlowRef.current * 30) + (snareIntensity * 10);
        ctx.shadowColor = color;
      }

      let area = { ...template.waveformArea };
      
      // Apply Transform
      const cx = area.x + area.width / 2;
      const cy = area.y + area.height / 2;
      area.width *= currentSettings.waveformScale;
      area.height *= currentSettings.waveformScale;
      area.x = cx - area.width / 2 + (template.width * (currentSettings.waveformOffsetX / 100));
      area.y = cy - area.height / 2 + (template.height * (currentSettings.waveformOffsetY / 100));
      
      if (currentSettings.stereoMode) {
        area = {
          ...area,
          width: area.width / 2 - 20,
          x: isRightChannel ? area.x + area.width / 2 + 10 : area.x
        };
      }

      switch (currentSettings.waveformStyle) {
        case 'BARS':
          WaveformStyler.drawBars(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, currentSettings.mirrorWaveform, isRightChannel);
          break;
        case 'DOTS':
          WaveformStyler.drawDots(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, currentSettings.mirrorWaveform);
          break;
        case 'WAVES':
          WaveformStyler.drawWaves(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, currentSettings.mirrorWaveform);
          break;
        case 'SPECTRUM':
          WaveformStyler.drawSpectrum(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, currentSettings.mirrorWaveform);
          break;
        case 'CIRCULAR':
          WaveformStyler.drawCircular(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, rotationAngleRef.current);
          break;
        case 'ANIMATED_LINE':
          WaveformStyler.drawAnimatedLine(ctx, area.x, area.y, area.width, area.height, data, color, currentSettings.barCount, beatGlowRef.current, timeRef.current, currentSettings.mirrorWaveform);
          break;
      }
      ctx.restore();
    };

    for (let i = currentSettings.multipleWaveforms - 1; i >= 0; i--) {
      const alpha = i === 0 ? 1.0 : 0.5 / i;
      const color = i === 0 ? currentSettings.primaryColor : currentSettings.secondaryColor;
      
      drawWaveformLayer(smoothedBarsRef.current[i], color, alpha, false);
      
      if (currentSettings.stereoMode) {
        const rightColor = i === 0 ? currentSettings.secondaryColor : currentSettings.primaryColor;
        drawWaveformLayer(smoothedBarsRef.current[i + currentSettings.multipleWaveforms], rightColor, alpha, true);
      }
    }

    // Draw Metadata
    if (currentSettings.showMetadata) {
      MetadataManager.drawMetadata(
        ctx,
        template.width,
        template.height,
        currentSettings.songName,
        currentSettings.artistName,
        currentSettings.metadataPosition,
        currentSettings.metadataFontSize,
        currentSettings.primaryColor,
        currentSettings.metadataFont
      );
    }

    // Particles
    particleSystemRef.current.updateAndDraw(
      ctx,
      template.width,
      template.height,
      currentSettings,
      beatGlowRef.current + (snareIntensity * 0.5)
    );

    // HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    
    ctx.fillText(`BASS  [0-200Hz] : ${Math.round(bands.bass).toString().padStart(3, '0')}`, 20, 30);
    ctx.fillText(`KICK  [50-100Hz]: ${Math.round(bands.kick).toString().padStart(3, '0')}`, 20, 50);
    ctx.fillText(`SNARE [2-5kHz]  : ${Math.round(bands.snare).toString().padStart(3, '0')}`, 20, 70);
    
    if (beatGlowRef.current > 0.1) {
      ctx.fillStyle = `rgba(255, 68, 68, ${beatGlowRef.current})`;
      ctx.fillText('> BEAT DETECTED', 20, 95);
    }
    
    animationRef.current = requestAnimationFrame(renderFrame);
  };

  const handleExport = async () => {
    if (!audioFile) return;
    
    try {
      setExportProgress({ progress: 0, status: 'Initializing export...' });
      
      let blob: Blob;
      
      if (settings.batchPlatforms.length > 0) {
        blob = await batchExporterRef.current.exportBatch(
          settings,
          imageSettings,
          audioFile,
          (progress, status) => setExportProgress({ progress, status })
        );
      } else {
        blob = await videoExporterRef.current.exportTo4K(
          settings,
          imageSettings,
          audioFile,
          (progress, status) => setExportProgress({ progress, status })
        );
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = settings.batchPlatforms.length > 0 ? 'visualizer_batch.zip' : `visualizer_${settings.platform}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Check console for details.');
    } finally {
      setExportProgress(null);
    }
  };

  const platformDims = PLATFORMS[settings.platform];
  const aspectRatio = platformDims.width / platformDims.height;

  return (
    <div className={`flex flex-col bg-[#050505] text-white font-sans ${isFullscreen ? 'fixed inset-0 z-50' : 'h-screen w-full overflow-hidden'}`}>
      {/* Header */}
      {!isFullscreen && (
        <header className="h-14 border-b border-[#2A2B30] bg-[#151619] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-[#00FF00] shadow-[0_0_10px_#00FF00]' : 'bg-[#FF4444]'}`} />
            <h1 className="text-sm font-bold tracking-widest">CX BEAT VISUALISER</h1>
          </div>
          <div className="text-[#8E9299] text-xs tracking-widest truncate max-w-[300px]">
            {fileName}
          </div>
        </header>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col bg-[#050505] relative">
          <div className="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
            <div 
              className="relative shadow-2xl border border-[#2A2B30] bg-black transition-all duration-300"
              style={{ 
                aspectRatio: `${aspectRatio}`,
                maxHeight: '100%',
                maxWidth: '100%'
              }}
            >
              <canvas 
                ref={canvasRef} 
                className="w-full h-full block"
              />
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-30" />
            </div>
          </div>

          {/* Export Overlay */}
          {exportProgress && (
            <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center backdrop-blur-sm">
              <div className="bg-[#151619] p-8 rounded-xl border border-[#2A2B30] w-96 max-w-[90%]">
                <h3 className="text-lg font-bold mb-4 tracking-widest text-center">EXPORTING VIDEO</h3>
                <div className="w-full bg-[#0A0A0C] h-4 rounded-full overflow-hidden mb-2 border border-[#2A2B30]">
                  <div 
                    className="h-full bg-[#FFA500] transition-all duration-300"
                    style={{ width: `${exportProgress.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-[#8E9299] tracking-wider">
                  <span>{exportProgress.status}</span>
                  <span>{Math.round(exportProgress.progress)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Image Controls */}
          {!isFullscreen && (
            <ImageControls settings={imageSettings} onChange={handleImageSettingsChange} />
          )}

          {/* Bottom Control Bar */}
          <div className={`h-20 bg-[#151619] border-t border-[#2A2B30] flex items-center px-6 gap-6 shrink-0 ${isFullscreen ? 'absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-none' : ''}`}>
            <button
              onClick={togglePlay}
              disabled={!audioUrl}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !audioUrl 
                  ? 'bg-[#2A2B30] text-[#4A4B50] cursor-not-allowed' 
                  : 'bg-[#FFA500] text-[#151619] hover:bg-[#FFD700] hover:shadow-[0_0_15px_rgba(255,165,0,0.4)]'
              }`}
            >
              {isPlaying ? <Pause size={20} className="fill-current" /> : <Play size={20} className="fill-current ml-1" />}
            </button>

            <button
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                  audioRef.current.currentTime = 0;
                  setIsPlaying(false);
                }
              }}
              disabled={!audioUrl}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !audioUrl 
                  ? 'bg-[#2A2B30] text-[#4A4B50] cursor-not-allowed' 
                  : 'bg-[#2A2B30] text-[#FFFFFF] hover:bg-[#3A3B40]'
              }`}
            >
              <Square size={16} className="fill-current" />
            </button>
            
            <div className="w-px h-8 bg-[#2A2B30] mx-2"></div>
            
            <button 
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-full bg-[#2A2B30] text-white flex items-center justify-center hover:bg-[#3A3B40] transition-colors"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>

            <div className="flex-1" />

            {!isFullscreen && (
              <>
                <label className="flex items-center gap-2 px-6 py-3 bg-[#2A2B30] hover:bg-[#3A3B40] text-[#FFFFFF] rounded-md cursor-pointer transition-colors text-xs tracking-wider border border-[#3A3B40]">
                  <Upload size={16} />
                  <span>LOAD AUDIO</span>
                  <input 
                    type="file" 
                    accept="audio/mp3,audio/wav,audio/flac,audio/*" 
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </label>

                <button
                  onClick={handleExport}
                  disabled={!audioUrl || exportProgress !== null}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors text-xs tracking-wider font-bold ${
                    !audioUrl || exportProgress !== null
                      ? 'bg-[#2A2B30] text-[#4A4B50] cursor-not-allowed border border-[#3A3B40]' 
                      : 'bg-[#00FF00] text-[#050505] hover:bg-[#33FF33] hover:shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                  }`}
                >
                  <Download size={16} />
                  <span>{settings.batchPlatforms.length > 0 ? 'EXPORT BATCH' : 'EXPORT 4K'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        {!isFullscreen && (
          <CustomizationPanel 
            settings={settings} 
            onChange={handleSettingsChange} 
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
          />
        )}
      </div>

      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
      />
    </div>
  );
}


