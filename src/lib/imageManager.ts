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

  public async updateSettings(settings: ImageSettings): Promise<void> {
    this.imageSettings = settings;
    if (settings.url) {
      if (!this.imageElement || this.imageElement.src !== settings.url) {
        await this.loadImage(settings.url);
      }
    } else {
      this.imageElement = null;
    }
  }

  public overlayImage(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, bounceScale: number = 1.0, resolutionScale: number = 1.0) {
    if (!this.imageElement) return;

    const { x, y, scale, rotation, shadow } = this.imageSettings;

    ctx.save();
    
    // Center of canvas, x and y are percentages (-100 to 100)
    const cx = canvasWidth / 2 + (canvasWidth * (x / 100));
    const cy = canvasHeight / 2 + (canvasHeight * (y / 100));

    ctx.translate(cx, cy);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Scale relative to canvas size so it looks consistent across aspect ratios
    // Base scale: 1.0 means the image width is 50% of the minimum canvas dimension
    const minDim = Math.min(canvasWidth, canvasHeight);
    const baseScale = (minDim * 0.5) / Math.max(this.imageElement.width, this.imageElement.height);
    
    const finalScale = scale * bounceScale * baseScale;
    ctx.scale(finalScale, finalScale);

    if (shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 20 * resolutionScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 10 * resolutionScale;
    }

    // Draw image centered at 0,0
    const imgWidth = this.imageElement.width;
    const imgHeight = this.imageElement.height;
    ctx.drawImage(this.imageElement, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);

    ctx.restore();
  }
}
