import { AppSettings } from './types';

export class WaveformStyler {
  static drawBars(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    mirror: boolean,
    isStereoRight: boolean = false,
    resolutionScale: number = 1.0
  ) {
    const barWidth = (w / barCount) - (2 * resolutionScale);
    const blockHeight = 4 * resolutionScale;
    const blockGap = 2 * resolutionScale;
    
    ctx.fillStyle = color;
    
    for (let i = 0; i < barCount; i++) {
      const barX = x + i * (barWidth + (2 * resolutionScale));
      let barHeight = (bars[i] / 255) * h;
      barHeight += kickPulse * (30 * resolutionScale) * (bars[i] / 255); 
      
      const numBlocks = Math.floor(barHeight / (blockHeight + blockGap));
      
      for (let j = 0; j < numBlocks; j++) {
        if (mirror) {
          // Draw top and bottom
          const yTop = y + (h / 2) - (j + 1) * (blockHeight + blockGap);
          const yBottom = y + (h / 2) + j * (blockHeight + blockGap);
          ctx.fillRect(barX, yTop, barWidth, blockHeight);
          ctx.fillRect(barX, yBottom, barWidth, blockHeight);
        } else {
          const barY = y + h - (j + 1) * (blockHeight + blockGap);
          ctx.fillRect(barX, barY, barWidth, blockHeight);
        }
      }
    }
  }

  static drawDots(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    mirror: boolean,
    resolutionScale: number = 1.0
  ) {
    const spacing = w / barCount;
    ctx.fillStyle = color;
    
    for (let i = 0; i < barCount; i++) {
      const dotX = x + i * spacing + spacing / 2;
      let amplitude = (bars[i] / 255);
      const radius = Math.max(2 * resolutionScale, amplitude * (spacing / 2) + (kickPulse * amplitude * 0.1));
      
      ctx.beginPath();
      if (mirror) {
        const yTop = y + (h / 2) - amplitude * (h / 2);
        const yBottom = y + (h / 2) + amplitude * (h / 2);
        ctx.arc(dotX, yTop, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dotX, yBottom, radius, 0, Math.PI * 2);
      } else {
        const dotY = y + h - amplitude * h;
        ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  static drawWaves(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    mirror: boolean,
    resolutionScale: number = 1.0
  ) {
    const spacing = w / (barCount - 1);
    
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * resolutionScale;
    ctx.fillStyle = color + '40'; // 25% opacity
    
    // Draw top wave
    ctx.moveTo(x, y + h);
    for (let i = 0; i < barCount; i++) {
      const waveX = x + i * spacing;
      let amplitude = (bars[i] / 255);
      let waveY = y + h - amplitude * h - (kickPulse * amplitude);
      if (mirror) {
        waveY = y + (h / 2) - amplitude * (h / 2) - (kickPulse * amplitude * 0.5);
      }
      
      if (i === 0) ctx.moveTo(waveX, waveY);
      else {
        const prevX = x + (i - 1) * spacing;
        let prevAmp = (bars[i-1] / 255);
        let prevY = y + h - prevAmp * h - (kickPulse * prevAmp);
        if (mirror) prevY = y + (h / 2) - prevAmp * (h / 2) - (kickPulse * prevAmp * 0.5);
        
        const cpX = (prevX + waveX) / 2;
        ctx.quadraticCurveTo(cpX, prevY, waveX, waveY);
      }
    }
    
    if (mirror) {
      // Draw bottom wave
      for (let i = barCount - 1; i >= 0; i--) {
        const waveX = x + i * spacing;
        let amplitude = (bars[i] / 255);
        let waveY = y + (h / 2) + amplitude * (h / 2) + (kickPulse * amplitude * 0.5);
        
        if (i === barCount - 1) ctx.lineTo(waveX, waveY);
        else {
          const prevX = x + (i + 1) * spacing;
          let prevAmp = (bars[i+1] / 255);
          let prevY = y + (h / 2) + prevAmp * (h / 2) + (kickPulse * prevAmp * 0.5);
          
          const cpX = (prevX + waveX) / 2;
          ctx.quadraticCurveTo(cpX, prevY, waveX, waveY);
        }
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  static drawSpectrum(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    mirror: boolean,
    resolutionScale: number = 1.0
  ) {
    const barWidth = (w / barCount) - (1 * resolutionScale);
    
    for (let i = 0; i < barCount; i++) {
      const barX = x + i * (barWidth + (1 * resolutionScale));
      let amplitude = (bars[i] / 255);
      let barHeight = amplitude * h + (kickPulse * amplitude);
      
      // Gradient based on frequency (i)
      const hue = (i / barCount) * 60 + 10; // Red to Yellow
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      
      if (mirror) {
        const yTop = y + (h / 2) - barHeight / 2;
        ctx.fillRect(barX, yTop, barWidth, barHeight);
      } else {
        const barY = y + h - barHeight;
        ctx.fillRect(barX, barY, barWidth, barHeight);
      }
    }
  }

  static drawCircular(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    rotationAngle: number,
    resolutionScale: number = 1.0
  ) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const radius = Math.min(w, h) * 0.2 + kickPulse * (0.5 * resolutionScale);
    const maxBarHeight = Math.min(w, h) * 0.3;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationAngle);
    
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * resolutionScale;
    
    // Draw center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    const angleStep = (Math.PI * 2) / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const angle = i * angleStep;
      let amplitude = (bars[i] / 255);
      const barHeight = amplitude * maxBarHeight;
      
      ctx.save();
      ctx.rotate(angle);
      
      // Draw bar outward
      ctx.fillRect(-2 * resolutionScale, radius, 4 * resolutionScale, barHeight);
      
      ctx.restore();
    }
    
    ctx.restore();
  }

  static drawAnimatedLine(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number,
    bars: Float32Array,
    color: string,
    barCount: number,
    kickPulse: number,
    time: number,
    mirror: boolean,
    resolutionScale: number = 1.0
  ) {
    const spacing = w / (barCount - 1);
    
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 4 * resolutionScale;
    ctx.shadowBlur = 15 * resolutionScale;
    ctx.shadowColor = color;
    
    const drawLine = (isBottom: boolean) => {
      ctx.beginPath();
      for (let i = 0; i < barCount; i++) {
        const lineX = x + i * spacing;
        let amplitude = (bars[i] / 255);
        
        // Add sine wave oscillation based on time
        const osc = Math.sin(time * 0.005 + i * 0.2) * amplitude * (20 * resolutionScale);
        
        let lineY = y + h / 2 - amplitude * (h / 2) - osc - (kickPulse * amplitude * (0.5 * resolutionScale));
        if (isBottom) {
          lineY = y + h / 2 + amplitude * (h / 2) + osc + (kickPulse * amplitude * (0.5 * resolutionScale));
        }
        
        if (i === 0) ctx.moveTo(lineX, lineY);
        else {
          const prevX = x + (i - 1) * spacing;
          let prevAmp = (bars[i-1] / 255);
          const prevOsc = Math.sin(time * 0.005 + (i-1) * 0.2) * prevAmp * (20 * resolutionScale);
          let prevY = y + h / 2 - prevAmp * (h / 2) - prevOsc - (kickPulse * prevAmp * (0.5 * resolutionScale));
          if (isBottom) {
            prevY = y + h / 2 + prevAmp * (h / 2) + prevOsc + (kickPulse * prevAmp * (0.5 * resolutionScale));
          }
          
          const cpX = (prevX + lineX) / 2;
          ctx.quadraticCurveTo(cpX, prevY, lineX, lineY);
        }
      }
      ctx.stroke();
    };
    
    if (mirror) {
      drawLine(false); // Top
      drawLine(true);  // Bottom
    } else {
      drawLine(false); // Single centered line
    }
    
    ctx.restore();
  }
}
