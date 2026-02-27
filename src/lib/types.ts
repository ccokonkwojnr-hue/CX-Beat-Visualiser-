export type Platform = 'YOUTUBE' | 'REELS' | 'TIKTOK' | 'TWITTER' | 'SQUARE';
export type WaveformStyle = 'BARS' | 'DOTS' | 'WAVES' | 'SPECTRUM' | 'CIRCULAR' | 'ANIMATED_LINE';
export type MetadataPosition = 'TL' | 'TR' | 'BL' | 'BR';

export interface AppSettings {
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  
  waveformStyle: WaveformStyle;
  mirrorWaveform: boolean;
  multipleWaveforms: number; // 1 to 4
  stereoMode: boolean;
  
  waveformScale: number;
  waveformOffsetX: number;
  waveformOffsetY: number;
  
  sensitivity: number;
  decayTime: number;
  barCount: number;
  
  circularRotation: boolean;
  rotationSpeed: number;
  rotationDirection: 'CW' | 'CCW';
  
  showMetadata: boolean;
  songName: string;
  artistName: string;
  metadataFontSize: number;
  metadataPosition: MetadataPosition;
  metadataFont: string;
  
  imageBounce: boolean;
  imageBounceIntensity: number;
  
  particles: boolean;
  
  duration: number;
  frameRate: number;
  platform: Platform;
  batchPlatforms: Platform[];
  glowEffect: boolean;
}

export interface ImageSettings {
  file: File | null;
  url: string | null;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  shadow: boolean;
}

export interface FrequencyBands {
  bass: number;
  kick: number;
  snare: number;
}
