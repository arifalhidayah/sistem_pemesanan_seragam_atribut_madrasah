import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, FilePlus, Package, BarChart3, Settings2, User } from 'lucide-react';

export default function Layout() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Failed to log out", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-600">
            <Package className="h-6 w-6" />
            <h1 className="text-xl font-bold tracking-tight">Koperasi MI</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">MI Darun Najah Srobyong</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <Home className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/master" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <Settings2 className="h-4 w-4" /> Data Master
          </Link>
          <Link to="/new-order" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <FilePlus className="h-4 w-4" /> Pemesanan Baru
          </Link>
          <Link to="/report" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <BarChart3 className="h-4 w-4" /> Laporan Rekap
          </Link>
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
            <User className="h-4 w-4" /> Profil Petugas
          </Link>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Login Sebagai:</p>
            <p className="text-sm font-bold text-slate-700 truncate">{currentUser.displayName || currentUser.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-600">
            <Package className="h-5 w-5" />
            <h1 className="text-lg font-bold">Koperasi MI</h1>
          </div>
          <button onClick={handleLogout} className="p-2 text-red-600">
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
