import React, { useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { generateReportPDF, generateTailorReportPDF } from '../utils/PdfGenerator';
import { Printer, TrendingUp, TrendingDown, Users, Shirt, Scissors, FileText } from 'lucide-react';

export default function Report() {
  const { orders, fetchOrders, loadingOrders } = useOrders();
  const { categories: masterCategories, loading: loadingMaster } = useMasterData();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1. Rekapitulasi Keuangan
  const financialSummary = orders.reduce(
    (acc, order) => {
      acc.totalRevenue += order.amountPaid || 0;
      acc.totalReceivables += order.remaining || 0;
      acc.totalExpected += order.grandTotal || 0;
      return acc;
    },
    { totalRevenue: 0, totalReceivables: 0, totalExpected: 0 }
  );

  // 2. Rekapitulasi Data Pesanan per Kategori
  // Structure: { [catId]: { [itemId/type]: { count: N, details: { Putra: {S:1}, Putri: {S:2} } } } }
  const categoryStats = {};

  orders.forEach(order => {
    // Process new structure if available
    if (order.categoriesSelections) {
      Object.entries(order.categoriesSelections).forEach(([catId, selectedItems]) => {
        if (!categoryStats[catId]) categoryStats[catId] = {};
        
        selectedItems.forEach(item => {
          const key = item.type || item.name;
          if (!categoryStats[catId][key]) {
            categoryStats[catId][key] = { name: key, count: 0, genderStats: { Putra: {}, Putri: {} } };
          }
          categoryStats[catId][key].count += 1;
          if (order.gender && item.name) {
            categoryStats[catId][key].genderStats[order.gender][item.name] = (categoryStats[catId][key].genderStats[order.gender][item.name] || 0) + 1;
          }
        });
      });
    } else {
      // BACKWARD COMPATIBILITY: Map old uniforms/attributes to standard categories if possible
      // This is a bit complex, but since we usually have 'cat-uniforms' for uniforms:
      if (order.uniforms) {
        if (!categoryStats['cat-uniforms']) categoryStats['cat-uniforms'] = {};
        order.uniforms.forEach(u => {
          const key = u.type || 'Seragam Standar';
          if (!categoryStats['cat-uniforms'][key]) {
            categoryStats['cat-uniforms'][key] = { name: key, count: 0, genderStats: { Putra: {}, Putri: {} } };
          }
          categoryStats['cat-uniforms'][key].count += 1;
          if (order.gender && u.name) {
            categoryStats['cat-uniforms'][key].genderStats[order.gender][u.name] = (categoryStats['cat-uniforms'][key].genderStats[order.gender][u.name] || 0) + 1;
          }
        });
      }
      // Attributes mapping... (simplified for now)
    }
  });

  const handlePrint = () => {
    generateReportPDF(orders, financialSummary, categoryStats, masterCategories);
  };

  const handlePrintTailor = () => {
    generateTailorReportPDF(orders, categoryStats, masterCategories);
  };

  if (loadingOrders || loadingMaster) {
    return <div className="text-center py-20 text-slate-500">Memuat data laporan...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-2 sm:px-4">
      <div className="md:flex md:items-center md:justify-between px-2">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Laporan & Rekapitulasi</h1>
          <p className="mt-1 text-slate-500">Ringkasan keuangan dan rincian pesanan MI Darun Najah Srobyong.</p>
        </div>
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
          <button onClick={handlePrintTailor} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm">
            <Scissors className="w-5 h-5" /> Data Penjahit
          </button>
          <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 text-sm">
            <Printer className="w-5 h-5" /> Laporan Keuangan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-2">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><TrendingUp className="w-12 sm:w-16 h-12 sm:h-16 text-emerald-600" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Total Pendapatan</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">Rp {financialSummary.totalRevenue.toLocaleString('id-ID')}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2">Uang yang sudah masuk (Lunas & DP)</div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><TrendingDown className="w-12 sm:w-16 h-12 sm:h-16 text-red-600" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Total Piutang</div>
          <div className="text-2xl sm:text-3xl font-black text-red-500 tracking-tight">Rp {financialSummary.totalReceivables.toLocaleString('id-ID')}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-400 mt-2">Estimasi tagihan yang belum dibayarkan</div>
        </div>
        <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Users className="w-12 sm:w-16 h-12 sm:h-16 text-white" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Estimasi Total</div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">Rp {financialSummary.totalExpected.toLocaleString('id-ID')}</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-300 mt-2">Target total pemasukan koperasi</div>
        </div>
      </div>

      <div className="space-y-12">
        {masterCategories.map((cat, catIdx) => {
          const stats = categoryStats[cat.id] || {};
          const hasData = Object.keys(stats).length > 0;

          return (
            <div key={cat.id}>
              <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 px-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${cat.type === 'grouped' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{catIdx + 1}</div>
                {cat.name}
              </h2>

              {!hasData ? (
                <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold">Belum ada pesanan untuk kategori ini.</div>
              ) : cat.type === 'grouped' ? (
                // Grouped Table (Sizing)
                <div className="space-y-8">
                  {Object.entries(stats).map(([typeName, data]) => {
                    const sizes = Array.from(new Set(cat.items.filter(i => i.type === typeName).map(i => i.name)));
                    return (
                      <div key={typeName} className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">{typeName}</h3>
                          <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Pemesanan Aktif</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-3 sm:px-6 py-4 text-left font-black text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">Gender</th>
                                {sizes.map(s => <th key={s} className="px-2 sm:px-4 py-4 text-center font-black text-slate-400 uppercase tracking-widest text-[9px] sm:text-[10px]">{s}</th>)}
                                <th className="px-3 sm:px-6 py-4 text-right font-black text-slate-800 bg-slate-100 uppercase tracking-widest text-[9px] sm:text-[10px]">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {['Putra', 'Putri'].map(gender => (
                                <tr key={gender} className="hover:bg-slate-50/50 transition-colors">
                                  <td className={`px-3 sm:px-6 py-4 font-black text-xs sm:text-sm ${gender === 'Putra' ? 'text-blue-600' : 'text-pink-600'}`}>{gender}</td>
                                  {sizes.map(s => (
                                    <td key={s} className="px-2 sm:px-4 py-4 text-center font-bold text-slate-600 text-xs sm:text-sm">
                                      {data.genderStats[gender][s] || 0}
                                    </td>
                                  ))}
                                  <td className="px-3 sm:px-6 py-4 text-right font-black text-slate-800 bg-slate-50/50 text-xs sm:text-sm">
                                    {sizes.reduce((sum, s) => sum + (data.genderStats[gender][s] || 0), 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white">
                              <tr>
                                <td className="px-3 sm:px-6 py-4 font-black text-xs sm:text-sm">TOTAL UNIT</td>
                                {sizes.map(s => (
                                  <td key={s} className="px-2 sm:px-4 py-4 text-center font-black text-emerald-400 text-sm sm:text-lg">
                                    {(data.genderStats.Putra[s] || 0) + (data.genderStats.Putri[s] || 0)}
                                  </td>
                                ))}
                                <td className="px-3 sm:px-6 py-4 text-right font-black text-lg sm:text-2xl text-white">
                                  {data.count}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Flat Table (List counts)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(stats).map(([itemName, data]) => (
                    <div key={itemName} className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm flex flex-col justify-between">
                       <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{itemName}</div>
                       <div className="flex items-end justify-between">
                          <div className="text-3xl font-black text-slate-800">{data.count} <span className="text-xs text-slate-400">Pcs</span></div>
                          <div className="flex flex-col text-[10px] font-black items-end">
                             <span className="text-blue-500">PA: {Object.values(data.genderStats.Putra).reduce((a,b)=>a+b, 0)}</span>
                             <span className="text-pink-500">PI: {Object.values(data.genderStats.Putri).reduce((a,b)=>a+b, 0)}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rincian Transaksi Per Petugas */}
      <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-sm mt-12">
        <div className="bg-slate-900 px-6 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Riwayat Transaksi Masuk</h2>
            <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Data Real-time per Petugas</p>
          </div>
          <FileText className="w-8 h-8 text-emerald-400 opacity-50" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Waktu</th>
                <th className="px-6 py-4 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Siswa / Wali</th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Nominal</th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Petugas (Penerima)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {orders.flatMap(order => 
                (order.paymentHistory || []).map((payment, pIdx) => ({
                  ...payment,
                  studentName: order.studentName,
                  guardianName: order.guardianName,
                  orderId: order.id,
                  key: `${order.id}-${pIdx}`
                }))
              )
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((trx) => (
                <tr key={trx.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-[11px] sm:text-sm text-slate-500">
                    <div className="font-bold sm:font-normal">{new Date(trx.date).toLocaleDateString('id-ID', { dateStyle: 'short' })}</div>
                    <div className="text-[10px] opacity-75">{new Date(trx.date).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[100px] sm:max-w-none">{trx.studentName}</div>
                    <div className="text-[9px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[100px] sm:max-w-none">Wali: {trx.guardianName}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right font-black text-emerald-600 text-xs sm:text-base">
                    Rp {trx.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-tight border border-slate-200">
                      {trx.receivedBy?.split(' ')[0] || '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.every(o => !o.paymentHistory || o.paymentHistory.length === 0) && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic font-medium">Belum ada transaksi pembayaran yang tercatat.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
