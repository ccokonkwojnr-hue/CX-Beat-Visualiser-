import { ImageSettings } from './types';

export class ImageManager {
  private imageElement: HTMLImageElement | null = null;
  private imageSettings: ImageSettings;

  constructor(settings: ImageSettings) {
    this.imageSettings = settings;
  }

  public async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageElement = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  public updateSettings(settings: ImageSettings) {
    this.imageSettings = settings;
    if (settings.url && (!this.imageElement || this.imageElement.src !== settings.url)) {
      this.loadImage(settings.url);
    }
  }

  public overlayImage(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, bounceScale: number = 1.0) {
    if (!this.imageElement) return;

    const { x, y, scale, rotation, shadow } = this.imageSettings;

    ctx.save();
    
    // Center of canvas
    const cx = canvasWidth / 2 + x;
    const cy = canvasHeight / 2 + y;

    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * bounceScale, scale * bounceScale);

    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10;
    }

    // Draw image centered at 0,0
    const imgWidth = this.imageElement.width;
    const imgHeight = this.imageElement.height;
    ctx.drawImage(this.imageElement, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    ctx.restore();
  }
}
