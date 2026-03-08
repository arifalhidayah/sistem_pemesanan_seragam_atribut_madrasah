import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Save, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { currentUser, updateDisplayName } = useAuth();
  const [name, setName] = useState(currentUser?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await updateDisplayName(name);
      setMessage({ type: 'success', text: 'Nama profil berhasil diperbarui!' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Gagal memperbarui nama. Coba lagi nanti.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Profil Petugas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Atur nama yang akan muncul pada setiap transaksi dan laporan.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3 border-4 border-white shadow-sm">
                <User className="w-10 h-10" />
              </div>
              <p className="text-sm font-semibold text-slate-700">{currentUser?.email}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Akun Terdaftar</p>
            </div>

            {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nama Tampilan Petugas</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg font-medium"
                placeholder="Masukkan nama lengkap Anda..."
                required
              />
              <p className="mt-2 text-xs text-slate-400 italic">
                * Nama ini akan otomatis disematkan pada setiap pesanan baru dan pembayaran yang Anda terima.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-5 h-5" />
                )}
                <span>SIMPAN PERUBAHAN</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
