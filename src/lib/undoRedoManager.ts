import { AppSettings, ImageSettings } from './types';

export class UndoRedoManager {
  private history: { appSettings: AppSettings; imageSettings: ImageSettings }[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 20;

  constructor(initialAppSettings: AppSettings, initialImageSettings: ImageSettings) {
    this.pushState(initialAppSettings, initialImageSettings);
  }

  public pushState(appSettings: AppSettings, imageSettings: ImageSettings) {
    // Remove any future states if we're not at the end of the history
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new state
    this.history.push({
      appSettings: JSON.parse(JSON.stringify(appSettings)),
      imageSettings: { ...imageSettings, file: imageSettings.file } // Keep file reference
    });

    // Enforce max history length
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  public undo(): { appSettings: AppSettings; imageSettings: ImageSettings } | null {
    if (this.canUndo()) {
      this.currentIndex--;
      const state = this.history[this.currentIndex];
      return {
        appSettings: JSON.parse(JSON.stringify(state.appSettings)),
        imageSettings: { ...state.imageSettings, file: state.imageSettings.file }
      };
    }
    return null;
  }

  public redo(): { appSettings: AppSettings; imageSettings: ImageSettings } | null {
    if (this.canRedo()) {
      this.currentIndex++;
      const state = this.history[this.currentIndex];
      return {
        appSettings: JSON.parse(JSON.stringify(state.appSettings)),
        imageSettings: { ...state.imageSettings, file: state.imageSettings.file }
      };
    }
    return null;
  }

  public canUndo(): boolean {
    return this.currentIndex > 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  public clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}
