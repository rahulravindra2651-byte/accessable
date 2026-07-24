import React from 'react';
import { LogOut, User, Settings } from 'lucide-react';

const Header = ({ role, onBack, user }) => (
  <header className={`p-4 flex justify-between items-center shadow-lg border-b ${role === 'impaired' ? 'bg-zinc-900 border-amber-400/20 text-amber-400' : 'bg-white border-slate-200 text-gray-900'}`}>
    <div className="flex items-center gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-lg border-2 border-current hover:bg-current hover:text-white transition-all duration-200"
      >
        <LogOut size={16} /> Sign Out
      </button>

      {/* User Info */}
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${role === 'impaired' ? 'bg-amber-400/20' : 'bg-blue-100'}`}>
          <User className={`h-4 w-4 ${role === 'impaired' ? 'text-amber-400' : 'text-blue-600'}`} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium">{user?.name || 'User'}</p>
          <p className="text-xs opacity-70">{user?.email}</p>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <h1 className="text-xl font-black italic tracking-tighter uppercase">AccessAble</h1>

      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full animate-pulse ${role === 'impaired' ? 'bg-amber-400' : 'bg-blue-600'}`} />
        <span className="text-xs font-medium capitalize hidden md:inline">{role} Mode</span>
      </div>

      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Settings className="h-5 w-5" />
      </button>
    </div>
  </header>
);

export default Header;
