import React from 'react';
import { ImageSettings } from '../lib/types';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface Props {
  settings: ImageSettings;
  onChange: (settings: ImageSettings) => void;
}

export function ImageControls({ settings, onChange }: Props) {
  const update = (key: keyof ImageSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (settings.url) URL.revokeObjectURL(settings.url);
      const url = URL.createObjectURL(file);
      onChange({ ...settings, file, url });
    }
  };

  const handleRemoveImage = () => {
    if (settings.url) URL.revokeObjectURL(settings.url);
    onChange({ ...settings, file: null, url: '' });
  };

  return (
    <div className="bg-[#151619] border-t border-[#2A2B30] p-4 text-xs text-[#8E9299]">
      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 px-4 py-2 bg-[#2A2B30] hover:bg-[#3A3B40] text-[#FFFFFF] rounded-md cursor-pointer transition-colors tracking-wider border border-[#3A3B40]">
          <ImageIcon size={16} />
          <span>{settings.url ? 'CHANGE IMAGE' : 'OVERLAY IMAGE'}</span>
          <input 
            type="file" 
            accept="image/png,image/jpeg,image/webp" 
            onChange={handleFileChange}
            className="hidden" 
          />
        </label>

        {settings.url && (
          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-2">
              <span>Scale</span>
              <input 
                type="range" min="0.1" max="3.0" step="0.1" 
                value={settings.scale} 
                onChange={e => update('scale', parseFloat(e.target.value))}
                onDoubleClick={() => update('scale', 1.0)}
                className="w-24 accent-[#FFA500]"
                title="Double-click to reset"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>X Offset</span>
              <input 
                type="range" min="-100" max="100" step="1" 
                value={settings.x} 
                onChange={e => update('x', parseInt(e.target.value))}
                onDoubleClick={() => update('x', 0)}
                className="w-24 accent-[#FFA500]"
                title="Double-click to reset"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Y Offset</span>
              <input 
                type="range" min="-100" max="100" step="1" 
                value={settings.y} 
                onChange={e => update('y', parseInt(e.target.value))}
                onDoubleClick={() => update('y', 0)}
                className="w-24 accent-[#FFA500]"
                title="Double-click to reset"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer ml-auto">
              <input 
                type="checkbox" 
                checked={settings.shadow} 
                onChange={e => update('shadow', e.target.checked)}
                className="accent-[#FFA500]"
              />
              <span>Shadow</span>
            </label>
            <button 
              onClick={handleRemoveImage}
              className="p-2 hover:bg-[#2A2B30] rounded-md text-[#FF4444] transition-colors"
              title="Remove Image"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
