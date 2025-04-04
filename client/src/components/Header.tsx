import { useState } from "react";

interface HeaderProps {
  onAddTask: () => void;
  isMobile: boolean;
}

export default function Header({ onAddTask, isMobile }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <span className="material-icons mr-2">schedule</span>
            <h1 className="text-xl font-medium">TaskScheduler</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden focus:outline-none" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="material-icons">menu</span>
            </button>
            <div className="hidden md:flex items-center space-x-4">
              <button className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-1 rounded">
                <span className="material-icons text-sm mr-1">sync</span>
                <span>Sync</span>
              </button>
              <button className="flex items-center bg-white/20 hover:bg-white/30 px-3 py-1 rounded">
                <span className="material-icons text-sm mr-1">settings</span>
                <span>Settings</span>
              </button>
              <div className="flex items-center bg-white/20 px-3 py-1 rounded">
                <span className="material-icons text-sm mr-1">account_circle</span>
                <span>User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu (hidden by default) */}
      {isMobile && isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-2">
            <button className="flex items-center px-3 py-2 w-full text-left">
              <span className="material-icons text-neutral-400 mr-2">sync</span>
              <span>Sync</span>
            </button>
            <button className="flex items-center px-3 py-2 w-full text-left">
              <span className="material-icons text-neutral-400 mr-2">settings</span>
              <span>Settings</span>
            </button>
            <div className="flex items-center px-3 py-2">
              <span className="material-icons text-neutral-400 mr-2">account_circle</span>
              <span>User</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
