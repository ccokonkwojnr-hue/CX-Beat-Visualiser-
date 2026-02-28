import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { AppSettings, ImageSettings, Platform } from './types';
import { FrameTemplate, PLATFORMS } from './frameTemplates';
import { AudioAnalyzer } from './audioAnalyzer';
import { ImageManager } from './imageManager';

export class VideoExporter {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  public async load() {
    if (!this.isLoaded) {
      await this.ffmpeg.load();
      this.isLoaded = true;
    }
  }

  public async exportTo4K(
    settings: AppSettings,
    imageSettings: ImageSettings,
    audioFile: File,
    onProgress: (progress: number, status: string) => void,
    renderFrameCallback: (ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, settings: AppSettings) => void,
    resetStateCallback: () => void
  ) {
    if (!this.isLoaded) await this.load();

    const { width, height } = PLATFORMS[settings.platform];
    const frameRate = settings.frameRate;
    const duration = settings.duration;
    const totalFrames = Math.floor(duration * frameRate);

    onProgress(0, 'Initializing export...');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    // Load audio buffer for offline processing
    const audioCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioData = await audioFile.arrayBuffer();
    const audioBuffer = await tempCtx.decodeAudioData(audioData);
    tempCtx.close();

    const offlineCtx = new audioCtxClass(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const offlineAnalyzer = new AudioAnalyzer(offlineCtx);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    offlineAnalyzer.connectSource(source);
    source.start(0);

    onProgress(5, 'Writing audio to virtual FS...');
    await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

    resetStateCallback();

    const frameDuration = 1 / frameRate;
    let currentFrame = 0;

    onProgress(10, 'Rendering frames...');

    await new Promise<void>((resolve) => {
      const processFrame = async () => {
        // Render frame
        renderFrameCallback(ctx, width, height, offlineAnalyzer, settings);

        // Convert to JPEG
        const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7));
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer();
          const fileName = `frame_${currentFrame.toString().padStart(4, '0')}.jpg`;
          await this.ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));
        }

        if (currentFrame % 10 === 0) {
          onProgress(10 + (currentFrame / totalFrames) * 40, `Rendering frame ${currentFrame}/${totalFrames}...`);
        }

        currentFrame++;
        if (currentFrame < totalFrames) {
          const nextTime = currentFrame * frameDuration;
          if (nextTime < audioBuffer.duration) {
            offlineCtx.suspend(nextTime).then(processFrame).catch(e => {
              console.warn('Suspend error:', e);
              resolve();
            });
            offlineCtx.resume();
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      };

      offlineCtx.suspend(0).then(processFrame).catch(e => {
        console.warn('Initial suspend error:', e);
        // Fallback if suspend(0) fails
        offlineCtx.suspend(frameDuration).then(processFrame).catch(() => resolve());
      });
      offlineCtx.startRendering();
    });

    onProgress(50, 'Encoding video with FFmpeg...');
    
    let videoBlob: Blob | null = null;
    
    try {
      // Run FFmpeg
      await this.ffmpeg.exec([
        '-framerate', frameRate.toString(),
        '-i', 'frame_%04d.jpg',
        '-i', 'audio.mp3',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-shortest',
        'output.mp4'
      ]);

      onProgress(90, 'Finalizing video...');
      
      const data = await this.ffmpeg.readFile('output.mp4');
      videoBlob = new Blob([data], { type: 'video/mp4' });
    } finally {
      // Cleanup
      for (let i = 0; i < currentFrame; i++) {
        try {
          this.ffmpeg.deleteFile(`frame_${i.toString().padStart(4, '0')}.jpg`);
        } catch (e) {
          // Ignore if file doesn't exist
        }
      }
      try { this.ffmpeg.deleteFile('audio.mp3'); } catch (e) {}
      try { this.ffmpeg.deleteFile('output.mp4'); } catch (e) {}
    }

    onProgress(100, 'Done!');
    if (!videoBlob) throw new Error('Failed to generate video blob');
    return videoBlob;
  }
}
