// Create audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sampleRate = audioContext.sampleRate;

// Function to generate a beep sound
function generateBeep(frequency, duration, type = 'sine', volume = 0.7) {
  const audioBuffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
  const channelData = audioBuffer.getChannelData(0);
  
  // Create the waveform
  for (let i = 0; i < audioBuffer.length; i++) {
    const t = i / sampleRate;
    
    if (type === 'sine') {
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) * volume;
    } else if (type === 'square') {
      channelData[i] = Math.sin(2 * Math.PI * frequency * t) >= 0 ? volume : -volume;
    } else if (type === 'sawtooth') {
      channelData[i] = ((t * frequency) % 1) * 2 - 1 * volume;
    } else if (type === 'triangle') {
      const period = 1 / frequency;
      const mod = t % period;
      const normalized = mod / period;
      
      if (normalized < 0.25) {
        channelData[i] = normalized * 4 * volume;
      } else if (normalized < 0.75) {
        channelData[i] = (0.5 - normalized) * 4 * volume;
      } else {
        channelData[i] = (normalized - 1) * 4 * volume;
      }
    }
    
    // Apply fade in/out to avoid clicks
    const fadeTime = 0.005; // 5ms fade
    const fadeInSamples = fadeTime * sampleRate;
    const fadeOutSamples = fadeTime * sampleRate;
    
    if (i < fadeInSamples) {
      channelData[i] *= i / fadeInSamples;
    } else if (i > audioBuffer.length - fadeOutSamples) {
      channelData[i] *= (audioBuffer.length - i) / fadeOutSamples;
    }
  }
  
  return audioBuffer;
}

// Generate start beep sound (higher pitch)
function generateStartBeep() {
  return generateBeep(1200, 0.1, 'sine');
}

// Generate stop beep sound (lower pitch)
function generateStopBeep() {
  return generateBeep(800, 0.1, 'sine');
}

// Convert AudioBuffer to WAV
function audioBufferToWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numChannels * 2;
  const buffer = new ArrayBuffer(44 + length);
  const view = new DataView(buffer);
  
  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // File length
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // Format chunk identifier
  writeString(view, 12, 'fmt ');
  // Format chunk length
  view.setUint32(16, 16, true);
  // Sample format (1 is PCM)
  view.setUint16(20, 1, true);
  // Channel count
  view.setUint16(22, numChannels, true);
  // Sample rate
  view.setUint32(24, audioBuffer.sampleRate, true);
  // Byte rate (sample rate * block align)
  view.setUint32(28, audioBuffer.sampleRate * numChannels * 2, true);
  // Block align (channel count * bytes per sample)
  view.setUint16(32, numChannels * 2, true);
  // Bits per sample
  view.setUint16(34, 16, true);
  // Data chunk identifier
  writeString(view, 36, 'data');
  // Data chunk length
  view.setUint32(40, length, true);
  
  // Write the PCM samples
  const offset = 44;
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      const int16 = sample < 0 ? sample * 32768 : sample * 32767;
      view.setInt16(offset + (i * numChannels + channel) * 2, int16, true);
    }
  }
  
  return buffer;
}

// Write a string to a DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Save the audio as WAV files
function saveAudioFile(audioBuffer, filename) {
  const wav = audioBufferToWav(audioBuffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Generate and save the beep sounds
function generateAndSaveBeeps() {
  const startBeep = generateStartBeep();
  const stopBeep = generateStopBeep();
  
  saveAudioFile(startBeep, 'start-blip.wav');
  saveAudioFile(stopBeep, 'stop-blip.wav');
  
  console.log('Audio files generated and saved!');
}

// Call the function when the page loads
window.onload = function() {
  const button = document.createElement('button');
  button.textContent = 'Generate Audio Files';
  button.onclick = generateAndSaveBeeps;
  document.body.appendChild(button);
  
  const info = document.createElement('p');
  info.textContent = 'Click the button to generate and download the audio files for the stopwatch.';
  document.body.appendChild(info);
};