# CX Beat Visualiser

A production-ready, web-based music visualizer built with React, HTML5 Canvas, Web Audio API, and FFmpeg.wasm. Designed for music producers and content creators to create professional beat-synced visuals for social media.

## Features

- **Real-time Audio Analysis**: Advanced frequency analysis with adaptive beat detection for kicks and snares.
- **Image Overlay System**: Upload and position custom background images with scaling and offset controls.
- **Multi-Platform Templates**: Export visualizations optimized for YouTube (16:9), TikTok/Reels (9:16), Twitter, and Square formats.
- **4K Video Export**: Client-side video rendering using FFmpeg.wasm.
- **Batch Export**: Export to multiple platform formats simultaneously with a single click.
- **Customization Panel**: Tweak colors, waveform sensitivity, decay times, and visual effects in real-time.
- **Undo/Redo Support**: Full undo/redo functionality for all parameter changes with debounced history for smooth performance.

## Recent Updates

### v1.1.0 - Batch Export & Performance Improvements (Feb 2026)

**New Features:**
- **Batch Export Functionality**: Export your visualization to multiple platform formats (YouTube, TikTok, Reels, Square) in a single render pass. Saves significant time when creating content for multiple social media channels.

**Bug Fixes:**
- **Real-time Animation Loop Fix**: Fixed critical bug where the animation loop would cancel itself immediately on first frame. The loop now directly checks the HTML audio element's `paused` state instead of relying on React state snapshots, ensuring all controls update instantly in real-time.
- **Undo/Redo Performance**: Added debouncing to undo history saves - now waits until you stop dragging a slider for 500ms before saving state. This prevents performance lag and keeps the undo history clean and useful.

## Architecture

The application is built using a modular architecture:

- `src/App.tsx`: Main application component and state management.
- `src/lib/audioAnalyzer.ts`: Handles Web Audio API, frequency analysis, and adaptive beat detection.
- `src/lib/imageManager.ts`: Manages image uploads, scaling, and canvas overlay rendering.
- `src/lib/frameTemplates.ts`: Defines layout templates for various social media platforms.
- `src/lib/videoExporter.ts`: Integrates FFmpeg.wasm for client-side video encoding.
- `src/lib/batchExporter.ts`: Coordinates batch export to multiple platform formats simultaneously.
- `src/lib/particleSystem.ts`: Manages particle explosion effects synced to beat detection.
- `src/components/CustomizationPanel.tsx`: UI for tweaking visualizer settings.
- `src/components/ImageControls.tsx`: UI for image overlay positioning.

## Usage

1. **Load Audio**: Click "LOAD AUDIO" to select an MP3, WAV, or FLAC file.
2. **Customize**: Use the right sidebar to change colors, waveform settings, and select your target platform.
3. **Add Image**: Click "OVERLAY IMAGE" to add a background image. Adjust scale and position.
4. **Preview**: Use the play/pause controls to preview the visualization.
5. **Export**: 
   - Click "EXPORT 4K" to render a single platform format.
   - Click "BATCH EXPORT" to render all selected platform formats simultaneously.
   - The progress bar will indicate the rendering status. Once complete, the MP4 file(s) will download automatically.

## Demo

![CX Beat Visualiser Demo](https://via.placeholder.com/800x450.png?text=Demo+Video+Coming+Soon)

*Demo video coming soon - showcasing beat-synced image bounce, particle explosions, and batch export workflow.*

## Technical Details

- **Beat Detection**: Uses a dynamic thresholding algorithm based on recent energy history to accurately detect kicks (50-100Hz) and snares (2-5kHz).
- **Video Export**: To prevent browser memory crashes during 4K export, the exporter writes frames to FFmpeg's virtual file system (MEMFS) and encodes them using H.264. Export duration is optimized for stability in browser environments.
- **SharedArrayBuffer**: The Vite dev server is configured with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers to enable `SharedArrayBuffer` support, which is required by FFmpeg.wasm.
- **Canvas Recording**: Uses MediaRecorder API with optimized frame capture to ensure smooth video output at configurable frame rates.

## Tech Stack

- **Frontend**: React 18, TypeScript, HTML5 Canvas
- **Audio**: Web Audio API, custom beat detection algorithms
- **Video**: FFmpeg.wasm, MediaRecorder API
- **Build**: Vite, npm
- **Deployment**: Google AI Studio, GitHub Pages compatible

## Development

### Installation

```bash
git clone https://github.com/ccokonkwojnr-hue/CX-Beat-Visualiser-.git
cd CX-Beat-Visualiser-
npm install
```

### Run locally

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

## Roadmap

- [ ] GPU-accelerated rendering for improved performance
- [ ] Preset system for saving favorite visualizer configurations
- [ ] Multi-track stem input support for more granular control
- [ ] Advanced particle effects library
- [ ] Audio visualizer waveform export option
- [ ] Custom font support for text overlays
- [ ] Direct upload to YouTube/TikTok APIs

## License

MIT License - See LICENSE file for details.

## Author

**Christian Cokonkwojnr-Hue** - Music Producer & Audio Engineer

Built with ❤️ for music producers and content creators.
