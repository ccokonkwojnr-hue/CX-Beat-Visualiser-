import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { AppSettings, ImageSettings, Platform } from './types';
import { FrameTemplate, PLATFORMS } from './frameTemplates';
import { AudioAnalyzer } from './audioAnalyzer';
import { ImageManager } from './imageManager';

export class VideoExporter {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private cancelExport: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  public async load() {
    if (!this.isLoaded) {
      await this.ffmpeg.load();
      this.isLoaded = true;
    }
  }

  public cancel() {
    this.cancelExport = true;
    try {
      this.ffmpeg.terminate();
      this.isLoaded = false;
    } catch (e) {
      console.error("Failed to terminate ffmpeg", e);
    }
  }

  public async exportTo4K(
    settings: AppSettings,
    imageSettings: ImageSettings,
    audioFile: File,
    onProgress: (progress: number, status: string) => void,
    renderFrameCallback: (ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, settings: AppSettings, imageManager: ImageManager) => void,
    resetStateCallback: () => void,
    imageManager: ImageManager
  ) {
    this.cancelExport = false;
    if (!this.isLoaded) await this.load();

    let { width, height } = PLATFORMS[settings.platform];
    
    // Apply resolution scaling
    let scale = 1;
    if (settings.resolution === '1080p') scale = 1080 / Math.min(width, height);
    if (settings.resolution === '720p') scale = 720 / Math.min(width, height);
    
    if (scale < 1) {
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      // Ensure dimensions are even numbers for ffmpeg
      width = width % 2 === 0 ? width : width + 1;
      height = height % 2 === 0 ? height : height + 1;
    }

    const frameRate = settings.frameRate;
    
    // Load audio buffer for offline processing
    const audioCtxClass = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioData = await audioFile.arrayBuffer();
    const audioBuffer = await tempCtx.decodeAudioData(audioData);
    tempCtx.close();

    const duration = settings.duration === 0 ? audioBuffer.duration : Math.min(settings.duration, audioBuffer.duration);
    const totalFrames = Math.floor(duration * frameRate);

    onProgress(0, 'Initializing export...');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    const offlineCtx = new audioCtxClass(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    const offlineAnalyzer = new AudioAnalyzer(offlineCtx);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    offlineAnalyzer.connectSource(source);
    
    const scriptProcessor = offlineCtx.createScriptProcessor(2048, audioBuffer.numberOfChannels, audioBuffer.numberOfChannels);
    const framesData: { main: Uint8Array, left: Uint8Array, right: Uint8Array, time: number }[] = [];
    
    scriptProcessor.onaudioprocess = () => {
      const main = new Uint8Array((offlineAnalyzer as any).analyser.frequencyBinCount);
      const left = new Uint8Array((offlineAnalyzer as any).analyserLeft.frequencyBinCount);
      const right = new Uint8Array((offlineAnalyzer as any).analyserRight.frequencyBinCount);
      
      (offlineAnalyzer as any).analyser.getByteFrequencyData(main);
      (offlineAnalyzer as any).analyserLeft.getByteFrequencyData(left);
      (offlineAnalyzer as any).analyserRight.getByteFrequencyData(right);
      
      framesData.push({ 
        main, left, right, 
        time: (framesData.length * 2048) / audioBuffer.sampleRate 
      });
    };
    
    (offlineAnalyzer as any).analyser.connect(scriptProcessor);
    scriptProcessor.connect(offlineCtx.destination);
    source.start(0);

    onProgress(5, 'Writing audio to virtual FS...');
    await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

    onProgress(10, 'Analyzing audio data...');
    await offlineCtx.startRendering();
    
    framesData.sort((a, b) => a.time - b.time);

    resetStateCallback();

    const frameDuration = 1 / frameRate;
    let currentFrame = 0;

    onProgress(20, 'Rendering frames...');

    for (let i = 0; i < totalFrames; i++) {
      if (this.cancelExport) {
        throw new Error('Export cancelled by user');
      }
      
      const currentTime = i * frameDuration;
      
      // Find closest frequency data frame
      let closestFrame = framesData[0];
      let minDiff = Infinity;
      // Optimize search by starting near the expected index
      const expectedIndex = Math.floor((currentTime * audioBuffer.sampleRate) / 2048);
      const startIndex = Math.max(0, expectedIndex - 5);
      const endIndex = Math.min(framesData.length - 1, expectedIndex + 5);
      
      for (let j = startIndex; j <= endIndex; j++) {
        if (!framesData[j]) continue;
        const diff = Math.abs(framesData[j].time - currentTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestFrame = framesData[j];
        }
      }

      if (closestFrame) {
        offlineAnalyzer.setMockData(closestFrame.main, closestFrame.left, closestFrame.right, currentTime);
      }

      // Render frame
      renderFrameCallback(ctx, width, height, offlineAnalyzer, settings, imageManager);

      // Convert to JPEG
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.7));
      if (blob) {
        const arrayBuffer = await blob.arrayBuffer();
        const fileName = `frame_${i.toString().padStart(4, '0')}.jpg`;
        await this.ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer));
      }

      if (i % 10 === 0) {
        onProgress(20 + (i / totalFrames) * 30, `Rendering frame ${i}/${totalFrames}...`);
      }
      currentFrame = i;
    }

    onProgress(50, 'Encoding video with FFmpeg...');
    
    let videoBlob: Blob | null = null;
    
    try {
      // Run FFmpeg
      await this.ffmpeg.exec([
        '-framerate', frameRate.toString(),
        '-i', 'frame_%04d.jpg',
        '-i', 'audio.mp3',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
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
