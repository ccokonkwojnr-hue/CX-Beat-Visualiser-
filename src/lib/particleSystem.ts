import { AppSettings } from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  
  public reset() {
    this.particles = [];
  }
  
  public updateAndDraw(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number, 
    settings: AppSettings, 
    beatIntensity: number
  ) {
    if (!settings.particles) return;

    // Emit new particles on beat
    if (beatIntensity > 0.5 && Math.random() > 0.5) {
      const count = Math.floor(beatIntensity * 10);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: width / 2 + (Math.random() - 0.5) * 100,
          y: height / 2 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 15 * beatIntensity,
          vy: (Math.random() - 0.5) * 15 * beatIntensity,
          life: 1.0,
          maxLife: 1.0 + Math.random() * 0.5,
          size: Math.random() * 4 + 1,
          color: Math.random() > 0.5 ? settings.primaryColor : settings.secondaryColor
        });
      }
    }

    // Update and draw
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      
      if (p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fill();
    }
    
    ctx.restore();
  }
}
