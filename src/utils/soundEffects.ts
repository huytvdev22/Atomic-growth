import confetti from 'canvas-confetti';

// Audio Context Singleton cho Web Audio API
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Phát âm thanh gõ nhẹ thiền định (Zen Bamboo Tap) khi check-in thói quen
 */
export function playZenTapSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Tần số nốt mộc (A4 ~ 440Hz chuyển dịch nhẹ sang 528Hz tần số năng lượng tích cực)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);

    // Rung nhẹ xúc giác trên thiết bị di động (nếu có hỗ trợ)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([25]);
    }
  } catch (err) {
    console.debug('Audio not supported or blocked:', err);
  }
}

/**
 * Bắn pháo hoa ăn mừng (Confetti) khi hoàn thành 100% mục tiêu ngày hoặc đạt mốc streak
 */
export function triggerCelebrationConfetti(): void {
  try {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#205A42', '#528B70', '#C97255', '#D89839', '#E4EFE9'],
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.debug('Confetti error:', err);
  }
}
