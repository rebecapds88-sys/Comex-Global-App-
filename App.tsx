import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { AppMode } from './types';
import { Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.GeneralAdvisor);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <Sidebar 
        currentMode={currentMode} 
        onModeSelect={setCurrentMode} 
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      <main className="flex-1 flex flex-col h-full w-full relative">
        {/* Mobile Header for Toggle */}
        <div className="md:hidden absolute top-4 left-4 z-10">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-md shadow-md text-slate-600 hover:text-blue-600"
          >
            <Menu size={24} />
          </button>
        </div>

        <ChatInterface currentMode={currentMode} />
      </main>
    </div>
  );
};

export default App;