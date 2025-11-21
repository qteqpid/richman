
let audioCtx: AudioContext | null = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const playDiceRoll = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    
    // Create a burst of digital noise/clicks
    for (let i = 0; i < 8; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(100 + Math.random() * 200, t + i * 0.08);
      
      gain.gain.setValueAtTime(0.05, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.05);
      
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.06);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playMove = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.2);
    
    osc.start(t);
    osc.stop(t + 0.2);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playPurchase = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    
    // Positive major triad arpeggio
    [0, 0.05].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 1200 : 1500, t + delay);
      
      gain.gain.setValueAtTime(0.1, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.4);
      
      osc.start(t + delay);
      osc.stop(t + delay + 0.4);
    });
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playPayment = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.linearRampToValueAtTime(100, t + 0.3);
    
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    
    osc.start(t);
    osc.stop(t + 0.3);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export const playMoneyGain = () => {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    
    // Ascending chime
    [0, 0.1, 0.2].forEach((delay, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        const freq = 800 + (i * 300);
        osc.frequency.setValueAtTime(freq, t + delay);
        
        gain.gain.setValueAtTime(0.05, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3);
        
        osc.start(t + delay);
        osc.stop(t + delay + 0.3);
    });
  } catch (e) {
    console.error("Audio error", e);
  }
};
