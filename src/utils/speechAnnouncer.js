/**
 * Centralised Speech & Screen Reader Announcer.
 *
 * Provides dual accessibility feedback:
 * 1. Speaks messages aloud via SpeechSynthesis (if voice guidance is active).
 * 2. Injects text into hidden ARIA live regions so screen readers (NVDA, JAWS,
 *    TalkBack, VoiceOver, Narrator) automatically announce the updates.
 */

let liveRegionPolite = null;
let liveRegionAssertive = null;

// Initialise ARIA live regions in DOM
const ensureLiveRegions = () => {
  if (typeof document === 'undefined') return;

  if (!liveRegionPolite) {
    liveRegionPolite = document.createElement('div');
    liveRegionPolite.id = 'aria-live-polite';
    liveRegionPolite.setAttribute('aria-live', 'polite');
    liveRegionPolite.setAttribute('aria-atomic', 'true');
    liveRegionPolite.className = 'sr-only';
    document.body.appendChild(liveRegionPolite);
  }

  if (!liveRegionAssertive) {
    liveRegionAssertive = document.createElement('div');
    liveRegionAssertive.id = 'aria-live-assertive';
    liveRegionAssertive.setAttribute('aria-live', 'assertive');
    liveRegionAssertive.setAttribute('aria-atomic', 'true');
    liveRegionAssertive.className = 'sr-only';
    document.body.appendChild(liveRegionAssertive);
  }
};

/**
 * Announce a message to screen readers and optionally speak it aloud.
 *
 * @param {string} message - Text to announce.
 * @param {'polite'|'assertive'} priority - ARIA live priority level.
 * @param {boolean} speakAloud - Whether to also speak via SpeechSynthesis.
 * @param {object} options - Speech options (rate, pitch, lang).
 */
export const announce = (
  message,
  priority = 'polite',
  speakAloud = true,
  options = {}
) => {
  if (!message || typeof message !== 'string') return;

  // 1. Inject into ARIA Live Region for Native Screen Readers
  ensureLiveRegions();
  const targetRegion = priority === 'assertive' ? liveRegionAssertive : liveRegionPolite;
  if (targetRegion) {
    // Clear and re-populate to trigger screen reader announcement
    targetRegion.textContent = '';
    setTimeout(() => {
      targetRegion.textContent = message;
    }, 50);
  }

// 2. Speak aloud via Web Speech Synthesis if requested and supported
  if (speakAloud && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const synth = window.speechSynthesis;

    if (priority === 'assertive') {
      // Assertive: interrupt immediately
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;
      utterance.lang = options.lang || 'en-US';
      if (options.voice) utterance.voice = options.voice;
      synth.speak(utterance);
    } else {
      // Polite: cancel any pending polite speech to prevent pile-up,
      // then speak after a short debounce so rapid nav changes only say the last message
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;
      utterance.lang = options.lang || 'en-US';
      if (options.voice) utterance.voice = options.voice;
      synth.speak(utterance);
    }
  }
};

/**
 * Stop any current speech synthesis playback.
 */
export const stopSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};
