import React from 'react';
import { MODES } from '../constants';
import { AppMode } from '../types';
import { Globe, Barcode, Scale, FileText, Ship, Menu, X } from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  onModeSelect: (mode: AppMode) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const iconMap: Record<string, React.ElementType> = {
  Globe,
  Barcode,
  Scale,
  FileText
};

export const Sidebar: React.FC<SidebarProps> = ({ currentMode, onModeSelect, isOpen, setIsOpen }) => {
  
  const handleSelect = (mode: AppMode) => {
    onModeSelect(mode);
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Ship className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ComexGlobal</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Modulos Especializados
          </div>
          <nav className="space-y-2">
            {Object.values(MODES).map((mode) => {
              const Icon = iconMap[mode.icon];
              const isActive = currentMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => handleSelect(mode.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <Icon size={20} />
                  <div className="flex flex-col items-start">
                    <span>{mode.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
          <div className="text-xs text-slate-500 text-center">
            <p>© {new Date().getFullYear()} ComexGlobal AI</p>
            <p className="mt-1">Powered by Gemini 2.5 & 3.0</p>
          </div>
        </div>
      </aside>
    </>
  );
};