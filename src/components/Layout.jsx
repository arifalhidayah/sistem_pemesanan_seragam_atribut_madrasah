import React from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, FilePlus, Package, BarChart3, Settings2, User } from 'lucide-react';

export default function Layout() {
  const { currentUser, logout } = useAuth();
  const location = useLocation();

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

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', mobileLabel: 'Beranda' },
    { path: '/master', icon: Settings2, label: 'Data Master', mobileLabel: 'Barang' },
    { path: '/new-order', icon: FilePlus, label: 'Pemesanan Baru', mobileLabel: 'Pesan', special: true },
    { path: '/report', icon: BarChart3, label: 'Laporan Rekap', mobileLabel: 'Laporan' },
    { path: '/profile', icon: User, label: 'Profil Petugas', mobileLabel: 'Profil' },
  ];

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
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.path) 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
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
      <main className="flex-1 flex flex-col pb-16 md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-emerald-600">
            <Package className="h-5 w-5" />
            <h1 className="text-lg font-black tracking-tight">Koperasi MI</h1>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-right mr-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Petugas</p>
                <p className="text-xs font-black text-slate-700 leading-tight truncate max-w-[100px]">{currentUser.displayName || 'Admin'}</p>
             </div>
             <button onClick={handleLogout} className="p-2 text-red-500 bg-red-50 rounded-lg">
               <LogOut className="h-4 w-4" />
             </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </div>

        {/* Bottom Navigation for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1 flex justify-around items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] pb-safe">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex flex-col items-center gap-0.5 p-2 transition-colors ${
                isActive(item.path) ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'
              }`}
            >
              {item.special ? (
                <>
                  <div className={`p-2 rounded-xl -mt-6 shadow-lg border-2 border-white transition-all ${
                    isActive(item.path) 
                      ? 'bg-emerald-600 text-white shadow-emerald-200' 
                      : 'bg-slate-400 text-white shadow-slate-100'
                  }`}>
                     <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter mt-1">{item.mobileLabel}</span>
                </>
              ) : (
                <>
                  <item.icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">{item.mobileLabel}</span>
                </>
              )}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
