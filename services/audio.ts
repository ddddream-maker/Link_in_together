export const getAudioContext = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return null;
  return new AudioContext();
};

export const playMatchSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const t = ctx.currentTime;
  
  // 1. The "Bloop" (Sine wave shifting pitch up)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  
  // Pitch envelope: A water drop typically pitches UP slightly due to bubble resonance
  osc.frequency.setValueAtTime(300, t); 
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);

  // Volume envelope: Fast attack, smooth decay
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.01); // Attack
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3); // Decay

  osc.start(t);
  osc.stop(t + 0.3);
};

export const playHintSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  // A bright "Idea" Ping (Lightbulb on)
  // Two oscillators for a richer bell-like tone
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);

  // Fundamental frequency (e.g., C6)
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(1046.50, t); 
  
  // Overtone (e.g., E6) to make it sound happy/major
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(1318.51, t);

  // Sharp attack, long ring out
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.15, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

  osc1.start(t);
  osc1.stop(t + 1.2);
  osc2.start(t);
  osc2.stop(t + 1.2);
};

export const playShuffleSound = () => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const t = ctx.currentTime;

  // Create a buffer of white noise
  const bufferSize = ctx.sampleRate * 1; // 1 second buffer
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    // White noise
    data[i] = Math.random() * 2 - 1;
  }

  // To simulate paper crumpling, we trigger multiple short, filtered bursts of noise
  const crumpleCount = 6;
  
  for (let i = 0; i < crumpleCount; i++) {
    const start = t + (Math.random() * 0.25); // Scatter events over 250ms
    const duration = 0.05 + (Math.random() * 0.05); // Short duration (50-100ms)

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter to remove harsh highs and deep lows, focusing on "crackle" freq
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800 + Math.random() * 800; // Varying center freq
    filter.Q.value = 1;

    const gain = ctx.createGain();
    
    // Envelope: Quick fade in and out
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.1 + Math.random() * 0.1, start + (duration * 0.2));
    gain.gain.linearRampToValueAtTime(0, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start(start);
    source.stop(start + duration + 0.05);
  }
};