import { useState } from "react";

interface HeaderProps {
  onAddTask: () => void;
  isMobile: boolean;
}

export default function Header({ onAddTask, isMobile }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <>
      <header className="header-macos sticky top-0 z-10">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-primary">schedule</span>
            <h1 className="text-lg font-medium text-gray-900">TaskScheduler</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={onAddTask}
              className="hidden md:flex items-center btn-macos rounded-md px-3 py-1.5 animate-scale"
            >
              <span className="material-icons text-sm mr-1 text-primary">add</span>
              <span className="text-sm">New Task</span>
            </button>
            
            <button 
              className="md:hidden focus:outline-none" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-icons text-gray-700">menu</span>
            </button>
            
            <div className="hidden md:flex items-center space-x-3">
              <button className="flex items-center btn-macos rounded-md px-3 py-1.5 animate-scale">
                <span className="material-icons text-sm mr-1 text-gray-500">sync</span>
                <span className="text-sm">Sync</span>
              </button>
              
              <button className="flex items-center btn-macos rounded-md px-3 py-1.5 animate-scale">
                <span className="material-icons text-sm mr-1 text-gray-500">settings</span>
                <span className="text-sm">Settings</span>
              </button>
              
              <div className="flex items-center ml-2">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="material-icons text-sm text-gray-600">person</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile menu (hidden by default) */}
      {isMobile && isMobileMenuOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-1">
            <button 
              onClick={onAddTask}
              className="flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100"
            >
              <span className="material-icons text-primary mr-2">add</span>
              <span>New Task</span>
            </button>
            <button className="flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100">
              <span className="material-icons text-gray-500 mr-2">sync</span>
              <span>Sync</span>
            </button>
            <button className="flex items-center px-3 py-2 w-full text-left rounded-md hover:bg-gray-100">
              <span className="material-icons text-gray-500 mr-2">settings</span>
              <span>Settings</span>
            </button>
            <div className="flex items-center px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                <span className="material-icons text-xs text-gray-600">person</span>
              </div>
              <span>User</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
