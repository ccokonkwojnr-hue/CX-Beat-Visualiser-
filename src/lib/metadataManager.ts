export class MetadataManager {
  static async extractMetadata(file: File): Promise<{ title: string; artist: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) {
          resolve({ title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown Artist' });
          return;
        }

        const view = new DataView(buffer);
        let title = '';
        let artist = '';

        // Check for ID3v2
        if (buffer.byteLength > 10 && view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
          // It's ID3v2
          let offset = 10;
          const size = (view.getUint8(6) << 21) | (view.getUint8(7) << 14) | (view.getUint8(8) << 7) | view.getUint8(9);
          
          while (offset < size && offset < buffer.byteLength - 10) {
            const frameId = String.fromCharCode(view.getUint8(offset), view.getUint8(offset+1), view.getUint8(offset+2), view.getUint8(offset+3));
            const frameSize = (view.getUint8(offset+4) << 24) | (view.getUint8(offset+5) << 16) | (view.getUint8(offset+6) << 8) | view.getUint8(offset+7);
            
            if (frameSize === 0) break;
            
            if (frameId === 'TIT2' || frameId === 'TPE1') {
              const encoding = view.getUint8(offset + 10);
              let text = '';
              if (encoding === 0 || encoding === 3) {
                // ISO-8859-1 or UTF-8
                for (let i = 1; i < frameSize; i++) {
                  const charCode = view.getUint8(offset + 10 + i);
                  if (charCode !== 0) text += String.fromCharCode(charCode);
                }
              } else if (encoding === 1 || encoding === 2) {
                // UTF-16
                for (let i = 3; i < frameSize; i += 2) {
                  const charCode = view.getUint16(offset + 10 + i, encoding === 1); // Little endian for encoding 1 usually, but simplified here
                  if (charCode !== 0) text += String.fromCharCode(charCode);
                }
              }
              
              if (frameId === 'TIT2') title = text;
              if (frameId === 'TPE1') artist = text;
            }
            
            offset += 10 + frameSize;
          }
        } 
        // Check for ID3v1 at the end
        else if (buffer.byteLength > 128) {
          const v1Offset = buffer.byteLength - 128;
          if (view.getUint8(v1Offset) === 0x54 && view.getUint8(v1Offset+1) === 0x41 && view.getUint8(v1Offset+2) === 0x47) {
            // TAG
            for (let i = 0; i < 30; i++) {
              const charCode = view.getUint8(v1Offset + 3 + i);
              if (charCode !== 0) title += String.fromCharCode(charCode);
            }
            for (let i = 0; i < 30; i++) {
              const charCode = view.getUint8(v1Offset + 33 + i);
              if (charCode !== 0) artist += String.fromCharCode(charCode);
            }
          }
        }

        title = title.trim() || file.name.replace(/\.[^/.]+$/, "");
        artist = artist.trim() || 'Unknown Artist';

        resolve({ title, artist });
      };

      reader.onerror = () => {
        resolve({ title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown Artist' });
      };

      // Read first 128KB to find ID3v2, or last 128 bytes for ID3v1
      // For simplicity, we'll just read the whole file as ArrayBuffer. It's local anyway.
      reader.readAsArrayBuffer(file);
    });
  }

  static drawMetadata(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    title: string,
    artist: string,
    position: 'TL' | 'TR' | 'BL' | 'BR',
    fontSize: number,
    color: string,
    fontFamily: string = '"Inter", sans-serif'
  ) {
    ctx.save();
    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';

    const text = artist !== 'Unknown Artist' ? `${title} - ${artist}` : title;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const padding = 40;

    let x = padding;
    let y = padding;

    switch (position) {
      case 'TL':
        x = padding;
        y = padding;
        ctx.textAlign = 'left';
        break;
      case 'TR':
        x = width - padding;
        y = padding;
        ctx.textAlign = 'right';
        break;
      case 'BL':
        x = padding;
        y = height - padding - fontSize;
        ctx.textAlign = 'left';
        break;
      case 'BR':
        x = width - padding;
        y = height - padding - fontSize;
        ctx.textAlign = 'right';
        break;
    }

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    const bgPadding = 15;
    if (ctx.textAlign === 'left') {
      ctx.fillRect(x - bgPadding, y - bgPadding, textWidth + bgPadding * 2, fontSize + bgPadding * 2);
    } else {
      ctx.fillRect(x - textWidth - bgPadding, y - bgPadding, textWidth + bgPadding * 2, fontSize + bgPadding * 2);
    }

    // Draw text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}
