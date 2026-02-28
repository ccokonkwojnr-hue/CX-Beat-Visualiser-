import JSZip from 'jszip';
import { AppSettings, ImageSettings, Platform } from './types';
import { VideoExporter } from './videoExporter';
import { AudioAnalyzer } from './audioAnalyzer';

import { ImageManager } from './imageManager';

export class BatchExporter {
  private videoExporter: VideoExporter;
  private cancelExport: boolean = false;

  constructor() {
    this.videoExporter = new VideoExporter();
  }

  public cancel() {
    this.cancelExport = true;
    this.videoExporter.cancel();
  }

  public async exportBatch(
    settings: AppSettings,
    imageSettings: ImageSettings,
    audioFile: File,
    onProgress: (progress: number, status: string) => void,
    renderFrameCallback: (ctx: CanvasRenderingContext2D, width: number, height: number, analyzer: AudioAnalyzer, settings: AppSettings, imageManager: ImageManager) => void,
    resetStateCallback: () => void,
    imageManager: ImageManager
  ) {
    this.cancelExport = false;
    const zip = new JSZip();
    const totalPlatforms = settings.batchPlatforms.length;

    for (let i = 0; i < totalPlatforms; i++) {
      if (this.cancelExport) throw new Error('Export cancelled by user');
      const platform = settings.batchPlatforms[i];
      const platformSettings = { ...settings, platform };

      onProgress(
        (i / totalPlatforms) * 100,
        `Exporting ${platform} (${i + 1}/${totalPlatforms})...`
      );

      const blob = await this.videoExporter.exportTo4K(
        platformSettings,
        imageSettings,
        audioFile,
        (progress, status) => {
          const overallProgress = ((i + progress / 100) / totalPlatforms) * 100;
          onProgress(overallProgress, `[${platform}] ${status}`);
        },
        renderFrameCallback,
        resetStateCallback,
        imageManager
      );

      zip.file(`visualizer_${platform}.mp4`, blob);
    }

    onProgress(95, 'Zipping files...');
    const zipBlob = await zip.generateAsync({ type: 'blob' });

    onProgress(100, 'Done!');
    return zipBlob;
  }
}
