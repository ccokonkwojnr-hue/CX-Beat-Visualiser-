import { FrequencyBands } from './types';

export class AudioAnalyzer {
  private ctx: AudioContext;
  private analyser: AnalyserNode;
  private analyserLeft: AnalyserNode;
  private analyserRight: AnalyserNode;
  private splitter: ChannelSplitterNode;
  private source: MediaElementAudioSourceNode | null = null;
  
  private dataArray: Uint8Array;
  private dataArrayLeft: Uint8Array;
  private dataArrayRight: Uint8Array;
  
  private history: { kick: number[], snare: number[], bass: number[] } = { kick: [], snare: [], bass: [] };
  private lastBeatTime: number = 0;
  private minBeatInterval: number = 250; // ms

  constructor(context?: AudioContext | OfflineAudioContext) {
    if (context) {
      this.ctx = context;
    } else {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.2;
    
    this.analyserLeft = this.ctx.createAnalyser();
    this.analyserLeft.fftSize = 2048;
    this.analyserLeft.smoothingTimeConstant = 0.2;
    
    this.analyserRight = this.ctx.createAnalyser();
    this.analyserRight.fftSize = 2048;
    this.analyserRight.smoothingTimeConstant = 0.2;
    
    this.splitter = this.ctx.createChannelSplitter(2);
    
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.dataArrayLeft = new Uint8Array(this.analyserLeft.frequencyBinCount);
    this.dataArrayRight = new Uint8Array(this.analyserRight.frequencyBinCount);
  }

  public resetHistory() {
    this.history = { kick: [], snare: [], bass: [] };
    this.lastBeatTime = 0;
  }

  public connect(audioElement: HTMLAudioElement) {
    if (!this.source) {
      this.source = this.ctx.createMediaElementSource(audioElement);
      this.connectSource(this.source);
    }
  }

  public connectSource(sourceNode: AudioNode) {
    // Main mix
    sourceNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    
    // Stereo split
    sourceNode.connect(this.splitter);
    this.splitter.connect(this.analyserLeft, 0);
    this.splitter.connect(this.analyserRight, 1);
  }

  public async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public getSampleRate() {
    return this.ctx.sampleRate;
  }

  public getFrequencyData(channel: 'MAIN' | 'LEFT' | 'RIGHT' = 'MAIN'): Uint8Array {
    if (channel === 'LEFT') {
      this.analyserLeft.getByteFrequencyData(this.dataArrayLeft);
      return this.dataArrayLeft;
    } else if (channel === 'RIGHT') {
      this.analyserRight.getByteFrequencyData(this.dataArrayRight);
      return this.dataArrayRight;
    } else {
      this.analyser.getByteFrequencyData(this.dataArray);
      return this.dataArray;
    }
  }

  public getFrequencyBands(): FrequencyBands {
    const sampleRate = this.ctx.sampleRate;
    const binSize = (sampleRate / 2) / this.dataArray.length;
    
    const getAverage = (minHz: number, maxHz: number) => {
      const startBin = Math.max(0, Math.floor(minHz / binSize));
      const endBin = Math.min(this.dataArray.length - 1, Math.ceil(maxHz / binSize));
      let sum = 0;
      let count = 0;
      for (let i = startBin; i <= endBin; i++) {
        sum += this.dataArray[i];
        count++;
      }
      return count > 0 ? sum / count : 0;
    };

    const bands = {
      bass: getAverage(0, 200),
      kick: getAverage(50, 100),
      snare: getAverage(2000, 5000)
    };

    // Keep history for adaptive thresholding
    this.history.kick.push(bands.kick);
    if (this.history.kick.length > 60) this.history.kick.shift();
    
    this.history.snare.push(bands.snare);
    if (this.history.snare.length > 60) this.history.snare.shift();

    this.history.bass.push(bands.bass);
    if (this.history.bass.length > 60) this.history.bass.shift();

    return bands;
  }

  public getLogarithmicBands(numBands: number, channel: 'MAIN' | 'LEFT' | 'RIGHT' = 'MAIN'): Float32Array {
    const data = channel === 'LEFT' ? this.dataArrayLeft : channel === 'RIGHT' ? this.dataArrayRight : this.dataArray;
    const bands = new Float32Array(numBands);
    const minLog = Math.log10(1); 
    const maxLog = Math.log10(data.length - 1);
    
    for (let i = 0; i < numBands; i++) {
      const startLog = minLog + (i / numBands) * (maxLog - minLog);
      const endLog = minLog + ((i + 1) / numBands) * (maxLog - minLog);
      
      const startBin = Math.floor(Math.pow(10, startLog));
      const endBin = Math.floor(Math.pow(10, endLog));
      
      let sum = 0;
      let count = 0;
      for (let j = startBin; j <= endBin && j < data.length; j++) {
        sum += data[j];
        count++;
      }
      bands[i] = count > 0 ? sum / count : 0;
    }
    return bands;
  }

  public detectKick(kickEnergy: number, sensitivity: number = 1.0): boolean {
    const now = this.ctx.currentTime * 1000;
    
    // Adaptive threshold based on recent history
    const avgKick = this.history.kick.reduce((a, b) => a + b, 0) / (this.history.kick.length || 1);
    const dynamicThreshold = Math.max(150, avgKick * 1.3) / sensitivity;

    if (kickEnergy > dynamicThreshold && (now - this.lastBeatTime) > this.minBeatInterval) {
      this.lastBeatTime = now;
      return true;
    }
    return false;
  }

  public detectBass(bassEnergy: number, sensitivity: number = 1.0): boolean {
    const now = this.ctx.currentTime * 1000;
    
    const avgBass = this.history.bass.reduce((a, b) => a + b, 0) / (this.history.bass.length || 1);
    const dynamicThreshold = Math.max(130, avgBass * 1.2) / sensitivity;

    if (bassEnergy > dynamicThreshold && (now - this.lastBeatTime) > this.minBeatInterval) {
      this.lastBeatTime = now;
      return true;
    }
    return false;
  }

  public detectSnare(snareEnergy: number, sensitivity: number = 1.0): number {
    const avgSnare = this.history.snare.reduce((a, b) => a + b, 0) / (this.history.snare.length || 1);
    const dynamicThreshold = Math.max(50, avgSnare * 1.2) / sensitivity;
    
    if (snareEnergy > dynamicThreshold) {
      return Math.min(1.0, (snareEnergy - dynamicThreshold) / 100);
    }
    return 0;
  }
}
