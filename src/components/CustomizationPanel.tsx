import React from 'react';
import { AppSettings, Platform, WaveformStyle, MetadataPosition } from '../lib/types';
import { Undo, Redo } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onChange: (settings: AppSettings) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function CustomizationPanel({ settings, onChange, onUndo, onRedo, canUndo, canRedo }: Props) {
  const update = (key: keyof AppSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const toggleBatchPlatform = (platform: Platform) => {
    const newBatch = settings.batchPlatforms.includes(platform)
      ? settings.batchPlatforms.filter(p => p !== platform)
      : [...settings.batchPlatforms, platform];
    update('batchPlatforms', newBatch);
  };

  return (
    <div className="w-80 bg-[#151619] border-l border-[#2A2B30] p-6 overflow-y-auto h-full text-xs text-[#8E9299]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white font-bold tracking-widest">CUSTOMIZATION</h2>
        <div className="flex gap-2">
          <button onClick={onUndo} disabled={!canUndo} className={`p-1 rounded ${canUndo ? 'text-white hover:bg-[#2A2B30]' : 'text-[#4A4B50]'}`}>
            <Undo size={16} />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className={`p-1 rounded ${canRedo ? 'text-white hover:bg-[#2A2B30]' : 'text-[#4A4B50]'}`}>
            <Redo size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Colors</h3>
          <div className="flex items-center justify-between">
            <span>Primary</span>
            <input 
              type="color" 
              value={settings.primaryColor} 
              onChange={e => update('primaryColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Secondary</span>
            <input 
              type="color" 
              value={settings.secondaryColor} 
              onChange={e => update('secondaryColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Background</span>
            <input 
              type="color" 
              value={settings.bgColor} 
              onChange={e => update('bgColor', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
            />
          </div>
        </div>

        {/* Waveform Style */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Waveform Style</h3>
          <select 
            value={settings.waveformStyle} 
            onChange={e => update('waveformStyle', e.target.value as WaveformStyle)}
            className="w-full bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-2 text-white"
          >
            <option value="BARS">Bars</option>
            <option value="DOTS">Dots</option>
            <option value="WAVES">Waves</option>
            <option value="SPECTRUM">Spectrum</option>
            <option value="CIRCULAR">Circular</option>
            <option value="ANIMATED_LINE">Animated Line</option>
          </select>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.mirrorWaveform} 
              onChange={e => update('mirrorWaveform', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Mirror Waveform</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.stereoMode} 
              onChange={e => update('stereoMode', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Stereo Mode</span>
          </label>
          <div className="flex items-center justify-between">
            <span>Multiple Waveforms</span>
            <select 
              value={settings.multipleWaveforms} 
              onChange={e => update('multipleWaveforms', parseInt(e.target.value))}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
            >
              <option value="1">1 Layer</option>
              <option value="2">2 Layers</option>
              <option value="3">3 Layers</option>
              <option value="4">4 Layers</option>
            </select>
          </div>
        </div>

        {/* Waveform Transform */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Waveform Transform</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Scale</span>
              <span>{settings.waveformScale.toFixed(2)}x</span>
            </div>
            <input 
              type="range" min="0.1" max="3.0" step="0.1" 
              value={settings.waveformScale} 
              onChange={e => update('waveformScale', parseFloat(e.target.value))}
              onDoubleClick={() => update('waveformScale', 1.0)}
              className="w-full accent-[#FFA500]"
              title="Double-click to reset"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>X Offset</span>
              <span>{settings.waveformOffsetX}%</span>
            </div>
            <input 
              type="range" min="-100" max="100" step="1" 
              value={settings.waveformOffsetX} 
              onChange={e => update('waveformOffsetX', parseInt(e.target.value))}
              onDoubleClick={() => update('waveformOffsetX', 0)}
              className="w-full accent-[#FFA500]"
              title="Double-click to reset"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Y Offset</span>
              <span>{settings.waveformOffsetY}%</span>
            </div>
            <input 
              type="range" min="-100" max="100" step="1" 
              value={settings.waveformOffsetY} 
              onChange={e => update('waveformOffsetY', parseInt(e.target.value))}
              onDoubleClick={() => update('waveformOffsetY', 0)}
              className="w-full accent-[#FFA500]"
              title="Double-click to reset"
            />
          </div>
        </div>

        {/* Audio Response */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Audio Response</h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Sensitivity</span>
              <span>{settings.sensitivity.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="0.1" max="2.0" step="0.1" 
              value={settings.sensitivity} 
              onChange={e => update('sensitivity', parseFloat(e.target.value))}
              onDoubleClick={() => update('sensitivity', 1.0)}
              className="w-full accent-[#FFA500]"
              title="Double-click to reset"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Decay Time</span>
              <span>{settings.decayTime.toFixed(2)}s</span>
            </div>
            <input 
              type="range" min="0.05" max="1.0" step="0.05" 
              value={settings.decayTime} 
              onChange={e => update('decayTime', parseFloat(e.target.value))}
              onDoubleClick={() => update('decayTime', 0.2)}
              className="w-full accent-[#FFA500]"
              title="Double-click to reset"
            />
          </div>
          <div className="flex items-center justify-between">
            <span>Bar Count</span>
            <select 
              value={settings.barCount} 
              onChange={e => update('barCount', parseInt(e.target.value))}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
            >
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="40">40</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>

        {/* Circular Mode */}
        {settings.waveformStyle === 'CIRCULAR' && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold uppercase">Circular Mode</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.circularRotation} 
                onChange={e => update('circularRotation', e.target.checked)}
                className="accent-[#FFA500]"
              />
              <span>Enable Rotation</span>
            </label>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Rotation Speed</span>
                <span>{settings.rotationSpeed.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="5.0" step="0.1" 
                value={settings.rotationSpeed} 
                onChange={e => update('rotationSpeed', parseFloat(e.target.value))}
                onDoubleClick={() => update('rotationSpeed', 1.0)}
                className="w-full accent-[#FFA500]"
                title="Double-click to reset"
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Direction</span>
              <select 
                value={settings.rotationDirection} 
                onChange={e => update('rotationDirection', e.target.value as 'CW' | 'CCW')}
                className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
              >
                <option value="CW">Clockwise</option>
                <option value="CCW">Counter-Clockwise</option>
              </select>
            </div>
          </div>
        )}

        {/* Extra Effects */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Extra Effects</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.imageBounce} 
              onChange={e => update('imageBounce', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Image Bounce on Beat</span>
          </label>
          {settings.imageBounce && (
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Bounce Intensity</span>
                <span>{settings.imageBounceIntensity.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="0.1" max="5.0" step="0.1" 
                value={settings.imageBounceIntensity} 
                onChange={e => update('imageBounceIntensity', parseFloat(e.target.value))}
                onDoubleClick={() => update('imageBounceIntensity', 1.0)}
                className="w-full accent-[#FFA500]"
                title="Double-click to reset"
              />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.particles} 
              onChange={e => update('particles', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Particle Explosions</span>
          </label>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Metadata</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.showMetadata} 
              onChange={e => update('showMetadata', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Show Song Info</span>
          </label>
          {settings.showMetadata && (
            <>
              <div className="space-y-1">
                <span>Song Name</span>
                <input 
                  type="text" 
                  value={settings.songName} 
                  onChange={e => update('songName', e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
                />
              </div>
              <div className="space-y-1">
                <span>Artist</span>
                <input 
                  type="text" 
                  value={settings.artistName} 
                  onChange={e => update('artistName', e.target.value)}
                  className="w-full bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <span>Font Style</span>
                <select 
                  value={settings.metadataFont} 
                  onChange={e => update('metadataFont', e.target.value)}
                  className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white max-w-[120px]"
                >
                  <option value='"Inter", sans-serif'>Inter</option>
                  <option value='"JetBrains Mono", monospace'>JetBrains Mono</option>
                  <option value='"Arial", sans-serif'>Arial</option>
                  <option value='"Times New Roman", serif'>Times New Roman</option>
                  <option value='"Courier New", monospace'>Courier New</option>
                  <option value='"Impact", sans-serif'>Impact</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Font Size</span>
                <select 
                  value={settings.metadataFontSize} 
                  onChange={e => update('metadataFontSize', parseInt(e.target.value))}
                  className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
                >
                  <option value="24">24px</option>
                  <option value="36">36px</option>
                  <option value="48">48px</option>
                  <option value="72">72px</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span>Position</span>
                <select 
                  value={settings.metadataPosition} 
                  onChange={e => update('metadataPosition', e.target.value as MetadataPosition)}
                  className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
                >
                  <option value="TL">Top Left</option>
                  <option value="TR">Top Right</option>
                  <option value="BL">Bottom Left</option>
                  <option value="BR">Bottom Right</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Video Export */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Video Export</h3>
          <div className="flex items-center justify-between">
            <span>Platform</span>
            <select 
              value={settings.platform} 
              onChange={e => update('platform', e.target.value as Platform)}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white max-w-[120px]"
            >
              <option value="YOUTUBE">YouTube (16:9)</option>
              <option value="REELS">Reels (9:16)</option>
              <option value="TIKTOK">TikTok (9:16)</option>
              <option value="TWITTER">Twitter (16:9)</option>
              <option value="SQUARE">Square (1:1)</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Duration</span>
            <select 
              value={settings.duration} 
              onChange={e => update('duration', parseInt(e.target.value))}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
            >
              <option value="15">15s</option>
              <option value="30">30s</option>
              <option value="60">1m</option>
              <option value="120">2m</option>
              <option value="180">3m</option>
              <option value="0">Full Song</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Frame Rate</span>
            <select 
              value={settings.frameRate} 
              onChange={e => update('frameRate', parseInt(e.target.value))}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
            >
              <option value="24">24 fps</option>
              <option value="30">30 fps</option>
              <option value="60">60 fps</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Resolution</span>
            <select 
              value={settings.resolution} 
              onChange={e => update('resolution', e.target.value as any)}
              className="bg-[#0A0A0C] border border-[#2A2B30] rounded px-2 py-1 text-white"
            >
              <option value="4K">4K (High Quality)</option>
              <option value="1080p">1080p (Standard)</option>
              <option value="720p">720p (Fast Export)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-[#2A2B30]">
            <h4 className="font-semibold mb-2">Batch Export Options:</h4>
            {[
              { id: 'YOUTUBE', label: 'YouTube (16:9)' },
              { id: 'REELS', label: 'Instagram Reels (9:16)' },
              { id: 'TIKTOK', label: 'TikTok (9:16)' },
              { id: 'TWITTER', label: 'Twitter (16:9)' },
              { id: 'SQUARE', label: 'Square (1:1)' },
            ].map(platform => (
              <label key={platform.id} className="flex items-center gap-2 cursor-pointer mb-1">
                <input 
                  type="checkbox" 
                  checked={settings.batchPlatforms.includes(platform.id as Platform)} 
                  onChange={() => toggleBatchPlatform(platform.id as Platform)}
                  className="accent-[#FFA500]"
                />
                <span>{platform.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold uppercase">Effects</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={settings.glowEffect} 
              onChange={e => update('glowEffect', e.target.checked)}
              className="accent-[#FFA500]"
            />
            <span>Glow Effect</span>
          </label>
        </div>

      </div>
    </div>
  );
}
