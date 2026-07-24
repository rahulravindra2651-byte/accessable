import React, { useEffect } from 'react';
import { useAssistant } from '../../hooks/useAssistant';
import { Eye, Languages, Mic, User } from 'lucide-react';

const SignIn = ({ onSignIn, user }) => {
  const { speak, listen } = useAssistant();

  useEffect(() => {
    // Voice Greeting on Load
    const greeting = `Welcome back, ${user?.name || 'User'}. Please choose your mode. Say Open Assistant for sensory mode, or say Open Translator for regular mode. You can also tap the screen.`;
    speak(greeting);

    // Auto-listen for voice commands
    const timer = setTimeout(() => {
      listen((cmd) => {
        if (cmd.includes("assistant") || cmd.includes("impaired") || cmd.includes("sensory")) {
          onSignIn('impaired');
        } else if (cmd.includes("translator") || cmd.includes("regular")) {
          onSignIn('regular');
        }
      });
    }, 8000);

    return () => clearTimeout(timer);
  }, [speak, listen, onSignIn, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* User Welcome Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Welcome back, {user?.name || 'User'}!</h2>
            <p className="text-sm text-gray-600">Choose your accessibility mode</p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left: Sensory Mode Sign In */}
        <button 
          onClick={() => onSignIn('impaired')}
          className="flex-1 group relative flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-black hover:from-amber-300 hover:to-orange-400 transition-all duration-300 transform hover:scale-[1.02] border-b-4 md:border-b-0 md:border-r-4 border-black/20"
          aria-label="Sign in to Assistant Mode"
        >
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          <Eye size={100} strokeWidth={2.5} className="mb-4 animate-pulse drop-shadow-lg" />
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Assistant</h1>
          <p className="text-lg font-bold opacity-80 uppercase mb-4">Sensory-Impaired Mode</p>
          <div className="bg-black/20 px-6 py-3 rounded-full font-bold backdrop-blur-sm flex items-center gap-2">
            <Mic size={20} /> "Open Assistant"
          </div>
          <div className="mt-4 text-sm opacity-70 text-center max-w-xs">
            Enhanced accessibility features for users with sensory impairments
          </div>
        </button>

        {/* Right: Regular Mode Sign In */}
        <button 
          onClick={() => onSignIn('regular')}
          className="flex-1 group relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white hover:from-blue-500 hover:to-indigo-600 transition-all duration-300 transform hover:scale-[1.02]"
          aria-label="Sign in to Regular Mode"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
          <Languages size={100} strokeWidth={1.5} className="mb-4 drop-shadow-lg" />
          <h1 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Translator</h1>
          <p className="text-lg font-bold opacity-80 uppercase mb-4">Regular User Mode</p>
          <div className="bg-white/20 px-6 py-3 rounded-full font-bold backdrop-blur-sm flex items-center gap-2">
            <Mic size={20} /> "Open Translator"
          </div>
          <div className="mt-4 text-sm opacity-70 text-center max-w-xs">
            Sign language translation and communication tools
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-100 p-4 text-center">
        <p className="text-sm text-gray-600">
          Need help? Use voice commands or contact our support team
        </p>
      </div>
    </div>
  );
};

export default SignIn;
