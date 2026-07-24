/**
 * Voice Navigation Command Matcher.
 *
 * Matches natural spoken user input against registered system actions.
 */

export const VOICE_COMMANDS = [
  {
    id: 'dashboard',
    patterns: [/go to dashboard/i, /open dashboard/i, /home/i],
    description: 'Navigate to main accessibility dashboard',
  },
  {
    id: 'captions',
    patterns: [/open captions/i, /live captions/i, /speech to text/i, /subtitles/i],
    description: 'Open Live Speech Captions tool',
  },
  {
    id: 'form',
    patterns: [/open form/i, /voice form/i, /fill form/i, /form assistant/i],
    description: 'Open Voice Form Filling assistant',
  },
  {
    id: 'ocr',
    patterns: [/open ocr/i, /scan document/i, /document scanner/i, /read document/i],
    description: 'Open OCR Document Scanner',
  },
  {
    id: 'read_page',
    patterns: [/read page/i, /read content/i, /read aloud/i, /page reader/i],
    description: 'Read the current page content aloud',
  },
  {
    id: 'stop_reading',
    patterns: [/stop reading/i, /pause reading/i, /stop voice/i, /be quiet/i],
    description: 'Stop or pause page reading',
  },
  {
    id: 'toggle_theme',
    patterns: [/toggle theme/i, /dark mode/i, /light mode/i],
    description: 'Toggle light and dark themes',
  },
  {
    id: 'high_contrast',
    patterns: [/high contrast/i, /toggle contrast/i],
    description: 'Toggle high contrast mode',
  },
  {
    id: 'sign_out',
    patterns: [/sign out/i, /log out/i, /exit/i],
    description: 'Sign out of the application',
  },
  {
    id: 'help',
    patterns: [/help/i, /what can i say/i, /voice commands/i, /options/i],
    description: 'Announce available voice commands',
  },
];

/**
 * Matches a transcript string to a voice command ID.
 * @param {string} transcript - Speech recognition output text.
 * @returns {{ id: string, match: string, description: string } | null}
 */
export const matchVoiceCommand = (transcript) => {
  if (!transcript || typeof transcript !== 'string') return null;
  const text = transcript.trim();

  for (const cmd of VOICE_COMMANDS) {
    for (const pattern of cmd.patterns) {
      if (pattern.test(text)) {
        return {
          id: cmd.id,
          match: text,
          description: cmd.description,
        };
      }
    }
  }

  return null;
};
