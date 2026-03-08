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
    <div className="w-full space-y-8 pb-12">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight break-words">Laporan & Rekapitulasi</h1>
          <p className="mt-1 text-sm text-slate-500 break-words">Ringkasan keuangan dan rincian pesanan MI Darun Najah.</p>
        </div>
        <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button onClick={handlePrintTailor} className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-xs sm:text-sm">
            <Scissors className="w-4 h-4 shrink-0" /> <span className="truncate">Data Penjahit</span>
          </button>
          <button onClick={handlePrint} className="flex-1 min-w-0 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95 text-xs sm:text-sm">
            <Printer className="w-4 h-4 shrink-0" /> <span className="truncate">Laporan Keuangan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-8 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><TrendingUp className="w-10 h-10 text-emerald-600" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-wide mb-1 sm:mb-2 truncate">Total Pendapatan</div>
          <div className="text-xl sm:text-3xl font-black text-emerald-600 tracking-tight truncate">Rp {financialSummary.totalRevenue.toLocaleString('id-ID')}</div>
          <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-1 sm:mt-2 truncate">Sudah masuk (Lunas & DP)</div>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-3xl border-2 border-slate-100 shadow-sm relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform"><TrendingDown className="w-10 h-10 text-red-600" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-wide mb-1 sm:mb-2 truncate">Total Piutang</div>
          <div className="text-xl sm:text-3xl font-black text-red-500 tracking-tight truncate">Rp {financialSummary.totalReceivables.toLocaleString('id-ID')}</div>
          <div className="text-[9px] sm:text-xs font-bold text-slate-400 mt-1 sm:mt-2 truncate">Tagihan belum bayar</div>
        </div>
        <div className="bg-slate-900 p-4 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden group min-w-0">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Users className="w-10 h-10 text-white" /></div>
          <div className="text-[10px] sm:text-sm font-black text-slate-400 uppercase tracking-wide mb-1 sm:mb-2 truncate">Estimasi Total</div>
          <div className="text-xl sm:text-3xl font-black text-white tracking-tight truncate">Rp {financialSummary.totalExpected.toLocaleString('id-ID')}</div>
          <div className="text-[9px] sm:text-xs font-bold text-slate-300 mt-1 sm:mt-2 truncate">Target pemasukan koperasi</div>
        </div>
      </div>

      <div className="space-y-12">
        {masterCategories.map((cat, catIdx) => {
          const stats = categoryStats[cat.id] || {};
          const hasData = Object.keys(stats).length > 0;

          return (
            <div key={cat.id}>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-lg flex items-center justify-center text-white font-bold text-sm ${cat.type === 'grouped' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{catIdx + 1}</div>
                <span className="truncate">{cat.name}</span>
              </h2>

              {!hasData ? (
                <div className="bg-white p-10 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 font-bold">Belum ada pesanan untuk kategori ini.</div>
              ) : cat.type === 'grouped' ? (
                // Grouped Table (Sizing)
                <div className="space-y-8">
                  {Object.entries(stats).map(([typeName, data]) => {
                    const sizes = Array.from(new Set(cat.items.filter(i => i.type === typeName).map(i => i.name)));
                    return (
                      <div key={typeName} className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                          <h3 className="font-black text-slate-800 uppercase tracking-wide text-[10px] sm:text-sm flex-1 min-w-0 truncate">{typeName}</h3>
                          <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0">Aktif</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50/50">
                                <th className="px-2 py-3 text-left font-black text-slate-400 uppercase tracking-wide text-[9px] whitespace-nowrap">Gender</th>
                                {sizes.map(s => <th key={s} className="px-2 py-3 text-center font-black text-slate-400 uppercase tracking-wide text-[9px] whitespace-nowrap">{s}</th>)}
                                <th className="px-2 py-3 text-right font-black text-slate-800 bg-slate-100 uppercase tracking-wide text-[9px] whitespace-nowrap">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {['Putra', 'Putri'].map(gender => (
                                <tr key={gender} className="hover:bg-slate-50/50 transition-colors">
                                  <td className={`px-2 py-3 font-black text-xs ${gender === 'Putra' ? 'text-blue-600' : 'text-pink-600'}`}>{gender}</td>
                                  {sizes.map(s => (
                                    <td key={s} className="px-2 py-3 text-center font-bold text-slate-600 text-xs">
                                      {data.genderStats[gender][s] || 0}
                                    </td>
                                  ))}
                                  <td className="px-2 py-3 text-right font-black text-slate-800 bg-slate-50/50 text-xs">
                                    {sizes.reduce((sum, s) => sum + (data.genderStats[gender][s] || 0), 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-900 text-white">
                              <tr>
                                <td className="px-2 py-3 font-black text-xs">TOTAL</td>
                                {sizes.map(s => (
                                  <td key={s} className="px-2 py-3 text-center font-black text-emerald-400 text-sm">
                                    {(data.genderStats.Putra[s] || 0) + (data.genderStats.Putri[s] || 0)}
                                  </td>
                                ))}
                                <td className="px-2 py-3 text-right font-black text-lg text-white">
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
      <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-sm mt-8">
        <div className="bg-slate-900 px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-black text-white tracking-tight">Riwayat Transaksi</h2>
            <p className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-wide font-bold">per Petugas</p>
          </div>
          <FileText className="w-6 h-6 text-emerald-400 opacity-50 shrink-0" />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
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
            <div key={trx.key} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-slate-800 truncate">{trx.studentName}</div>
                <div className="text-[10px] text-slate-400 truncate">Wali: {trx.guardianName}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(trx.date).toLocaleDateString('id-ID', { dateStyle: 'short' })} · {new Date(trx.date).toLocaleTimeString('id-ID', { timeStyle: 'short' })}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-black text-emerald-600 text-sm">Rp {trx.amount.toLocaleString('id-ID')}</div>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[9px] font-black uppercase border border-slate-200">
                  {trx.receivedBy?.split(' ')[0] || '-'}
                </span>
              </div>
            </div>
          ))}
          {orders.every(o => !o.paymentHistory || o.paymentHistory.length === 0) && (
            <div className="px-4 py-8 text-center text-slate-400 italic text-sm">Belum ada transaksi.</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <div>{new Date(trx.date).toLocaleDateString('id-ID', { dateStyle: 'short' })}</div>
                    <div className="text-[10px] opacity-75">{new Date(trx.date).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-800">{trx.studentName}</div>
                    <div className="text-[11px] text-slate-400">Wali: {trx.guardianName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-black text-emerald-600">
                    Rp {trx.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-[10px] font-black uppercase tracking-tight border border-slate-200">
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
