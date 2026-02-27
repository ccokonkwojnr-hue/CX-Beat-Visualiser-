import { Platform } from './types';

export const PLATFORMS: Record<Platform, { width: number; height: number; name: string }> = {
  YOUTUBE: { width: 3840, height: 2160, name: 'YouTube (16:9)' },
  REELS: { width: 2160, height: 3840, name: 'IG Reels (9:16)' },
  TIKTOK: { width: 2160, height: 3840, name: 'TikTok (9:16)' },
  TWITTER: { width: 3840, height: 2160, name: 'Twitter (16:9)' },
  SQUARE: { width: 2160, height: 2160, name: 'Square (1:1)' },
};

export class FrameTemplate {
  static getCanvasDimensions(platform: Platform) {
    return PLATFORMS[platform];
  }

  static getTemplate(platform: Platform) {
    const dims = PLATFORMS[platform];
    const waveArea = this.getWaveformArea(platform, dims.width, dims.height);
    return {
      width: dims.width,
      height: dims.height,
      waveformArea: {
        x: waveArea.x,
        y: waveArea.y,
        width: waveArea.w,
        height: waveArea.h
      }
    };
  }

  static getWaveformArea(platform: Platform, width: number, height: number) {
    switch (platform) {
      case 'YOUTUBE':
      case 'TWITTER':
        return {
          x: width * 0.1,
          y: height * 0.7,
          w: width * 0.8,
          h: height * 0.2,
        };
      case 'REELS':
      case 'TIKTOK':
        return {
          x: width * 0.1,
          y: height * 0.8,
          w: width * 0.8,
          h: height * 0.15,
        };
      case 'SQUARE':
        return {
          x: width * 0.1,
          y: height * 0.75,
          w: width * 0.8,
          h: height * 0.2,
        };
      default:
        return { x: 0, y: 0, w: width, h: height };
    }
  }

  static getImageArea(platform: Platform, width: number, height: number) {
    switch (platform) {
      case 'YOUTUBE':
      case 'TWITTER':
        return {
          x: width * 0.5,
          y: height * 0.4,
          maxW: width * 0.6,
          maxH: height * 0.6,
        };
      case 'REELS':
      case 'TIKTOK':
        return {
          x: width * 0.5,
          y: height * 0.4,
          maxW: width * 0.8,
          maxH: height * 0.5,
        };
      case 'SQUARE':
        return {
          x: width * 0.5,
          y: height * 0.4,
          maxW: width * 0.7,
          maxH: height * 0.6,
        };
      default:
        return { x: width / 2, y: height / 2, maxW: width, maxH: height };
    }
  }
}
