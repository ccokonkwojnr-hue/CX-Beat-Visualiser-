# Spectral Studio

A production-ready, web-based music visualizer built with React, HTML5 Canvas, Web Audio API, and FFmpeg.wasm.

## Features

- **Real-time Audio Analysis**: Advanced frequency analysis with adaptive beat detection for kicks and snares.
- **Image Overlay System**: Upload and position custom background images with scaling and offset controls.
- **Multi-Platform Templates**: Export visualizations optimized for YouTube (16:9), TikTok/Reels (9:16), Twitter, and Square formats.
- **4K Video Export**: Client-side video rendering using FFmpeg.wasm.
- **Customization Panel**: Tweak colors, waveform sensitivity, decay times, and visual effects in real-time.

## Architecture

The application is built using a modular architecture:

- `src/App.tsx`: Main application component and state management.
- `src/lib/audioAnalyzer.ts`: Handles Web Audio API, frequency analysis, and adaptive beat detection.
- `src/lib/imageManager.ts`: Manages image uploads, scaling, and canvas overlay rendering.
- `src/lib/frameTemplates.ts`: Defines layout templates for various social media platforms.
- `src/lib/videoExporter.ts`: Integrates FFmpeg.wasm for client-side video encoding.
- `src/components/CustomizationPanel.tsx`: UI for tweaking visualizer settings.
- `src/components/ImageControls.tsx`: UI for image overlay positioning.

## Usage

1. **Load Audio**: Click "LOAD AUDIO" to select an MP3, WAV, or FLAC file.
2. **Customize**: Use the right sidebar to change colors, waveform settings, and select your target platform.
3. **Add Image**: Click "OVERLAY IMAGE" to add a background image. Adjust scale and position.
4. **Preview**: Use the play/pause controls to preview the visualization.
5. **Export**: Click "EXPORT 4K" to render the video. The progress bar will indicate the rendering status. Once complete, the MP4 file will download automatically.

## Technical Details

- **Beat Detection**: Uses a dynamic thresholding algorithm based on recent energy history to accurately detect kicks (50-100Hz) and snares (2-5kHz).
- **Video Export**: To prevent browser memory crashes during 4K export, the exporter writes frames to FFmpeg's virtual file system (MEMFS) and encodes them using H.264. Note: For demonstration purposes, the export is limited to a short duration to ensure stability in the browser environment.
- **SharedArrayBuffer**: The Vite dev server is configured with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers to enable `SharedArrayBuffer` support, which is required by FFmpeg.wasm.
