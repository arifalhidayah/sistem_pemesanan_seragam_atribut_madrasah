import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { Printer, Search, FileText, Edit, Trash2, MessageSquare, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { generateInvoicePDF } from '../utils/PdfGenerator';
import { uploadAndGetWhatsAppLink } from '../utils/WhatsAppUtils';

export default function Dashboard() {
  const { orders, fetchOrders, loadingOrders, deleteOrder } = useOrders();
  const { categories: masterCategories } = useMasterData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingWA, setIsProcessingWA] = useState(null); // ID of order being processed
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = useMemo(() => {
    let result = orders.filter(
      order =>
        order.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.guardianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      result.sort((a, b) => {
        let valA, valB;

        switch (sortConfig.key) {
          case 'createdAt':
            valA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            valB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            break;
          case 'studentName':
            valA = a.studentName?.toLowerCase() || '';
            valB = b.studentName?.toLowerCase() || '';
            break;
          case 'guardianName':
            valA = a.guardianName?.toLowerCase() || '';
            valB = b.guardianName?.toLowerCase() || '';
            break;
          case 'grandTotal':
            valA = a.grandTotal || 0;
            valB = b.grandTotal || 0;
            break;
          case 'remaining':
            valA = a.remaining || 0;
            valB = b.remaining || 0;
            break;
          case 'status':
            valA = a.status || '';
            valB = b.status || '';
            break;
          default:
            valA = a[sortConfig.key];
            valB = b[sortConfig.key];
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [orders, searchTerm, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 text-slate-300 ml-1 inline-block" />;
    return sortConfig.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-emerald-500 ml-1 inline-block" />
      : <ArrowDown className="w-3 h-3 text-emerald-500 ml-1 inline-block" />;
  };

  const handlePrint = (order) => {
    generateInvoicePDF(order, true, masterCategories);
  };

  const handleWhatsApp = async (order) => {
    if (!order.whatsappNumber) {
      alert("Nomor WhatsApp tidak tersedia untuk pesanan ini.");
      return;
    }

    setIsProcessingWA(order.id);
    try {
      // 1. Generate PDF Blob (don't save/download)
      const pdfBlob = generateInvoicePDF(order, false, masterCategories);

      if (!pdfBlob) {
        alert("Gagal membuat file PDF.");
        return;
      }

      // 2. Upload and get WA Link
      const waUrl = await uploadAndGetWhatsAppLink(order, pdfBlob);

      if (waUrl) {
        // Gunakan window.location.href bukan window.open() agar tidak diblokir
        // oleh Safari iOS. Safari memblokir window.open() yang dipanggil setelah
        // operasi async (gesture user context sudah hilang).
        window.location.href = waUrl;
      } else {
        alert("Gagal memproses link WhatsApp.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat memproses WhatsApp.");
    } finally {
      setIsProcessingWA(null);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pesanan ini? Data yang dihapus tidak dapat dikembalikan.")) {
      const result = await deleteOrder(id);
      if (!result.success) {
        alert("Gagal menghapus pesanan: " + result.error);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Lunas':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">Lunas</span>;
      case 'Belum Lunas':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm">Belum Lunas</span>;
      case 'Belum Bayar':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 shadow-sm">Belum Bayar</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200 shadow-sm">{status}</span>;
    }
  };

  const getBenefitBadge = (order) => {
    if (!order.studentBenefitStatus || order.studentBenefitStatus === 'none') return null;
    const label = order.studentBenefitStatus === 'yatim' ? 'Yatim/Piatu' : (order.studentBenefitNote || 'Khusus');
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider border border-amber-200 shadow-sm">
        ✨ {label}
      </span>
    );
  };

  return (
    <div className="w-full">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Pesanan</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftar pemesanan koperai MI Darun Najah Srobyong.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-md py-2 px-3 border transition-colors shadow-sm"
              placeholder="Cari nama / wali / status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white shadow-sm border border-slate-200 p-3 md:p-4 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[10px] md:text-sm font-bold text-slate-500 mb-1 uppercase tracking-wider text-center">Total Pesanan</span>
          <span className="text-2xl md:text-3xl font-black text-slate-800">{filteredOrders.length}</span>
        </div>
        <div className="bg-white shadow-sm border border-blue-200 p-3 md:p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-full outline-none"></div>
          <span className="text-[10px] md:text-sm font-bold text-blue-600 mb-1 uppercase tracking-wider z-10 text-center">Putra</span>
          <span className="text-2xl md:text-3xl font-black text-blue-700 z-10">
            {filteredOrders.filter(o => o.gender === 'Putra').length}
          </span>
        </div>
        <div className="bg-white shadow-sm border border-pink-200 p-3 md:p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-50 rounded-bl-full outline-none"></div>
          <span className="text-[10px] md:text-sm font-bold text-pink-600 mb-1 uppercase tracking-wider z-10 text-center">Putri</span>
          <span className="text-2xl md:text-3xl font-black text-pink-700 z-10">
            {filteredOrders.filter(o => o.gender === 'Putri').length}
          </span>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loadingOrders ? (
          <div className="bg-white p-8 text-center text-sm text-slate-500 rounded-xl border border-slate-200">
            Memuat data pesanan...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white p-8 text-center text-sm text-slate-500 rounded-xl border border-slate-200">
            Tidak ada data pesanan.
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className="bg-slate-100 border border-slate-200 text-slate-600 text-sm font-black rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Siswa</div>
                    <div className="text-lg font-black text-slate-900 leading-tight">{order.studentName}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <div className="text-sm font-medium text-slate-500">{order.gender} • {order.createdAt?.toDate().toLocaleDateString('id-ID')}</div>
                      {getBenefitBadge(order)}
                    </div>
                  </div>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Biaya</div>
                  <div className="text-sm font-black text-slate-900">Rp {order.grandTotal?.toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Tagihan</div>
                  <div className={`text-sm font-black ${order.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {order.remaining > 0 ? `Rp ${order.remaining.toLocaleString('id-ID')}` : 'LUNAS'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex -space-x-2">
                  {/* Mini preview for items if needed or just guardian */}
                  <div className="text-xs text-slate-500 font-medium">Wali: <span className="text-slate-900 font-bold">{order.guardianName}</span></div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleWhatsApp(order)}
                    disabled={isProcessingWA === order.id}
                    className={`p-2.5 rounded-xl border transition-all ${isProcessingWA === order.id ? 'bg-slate-50 text-slate-300' : 'bg-emerald-50 border-emerald-100 text-emerald-600 active:scale-95'}`}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate(`/edit-order/${order.id}`)}
                    className="p-2.5 rounded-xl border bg-blue-50 border-blue-100 text-blue-600 active:scale-95 transition-all"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handlePrint(order)}
                    className="p-2.5 rounded-xl border bg-slate-50 border-slate-200 text-slate-600 active:scale-95 transition-all"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="p-2.5 rounded-xl border bg-red-50 border-red-100 text-red-500 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow-sm overflow-hidden border-b border-slate-200 sm:rounded-xl">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 cursor-default select-none">
                      No
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('createdAt')}
                    >
                      Tanggal {getSortIcon('createdAt')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('studentName')}
                    >
                      Siswa {getSortIcon('studentName')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('guardianName')}
                    >
                      Wali / Alamat {getSortIcon('guardianName')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('grandTotal')}
                    >
                      Total {getSortIcon('grandTotal')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('remaining')}
                    >
                      Sisa Tagihan {getSortIcon('remaining')}
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors select-none group"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th scope="col" className="relative px-6 py-3 text-right">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-sm text-slate-500">
                        Memuat data pesanan...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-sm text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p>Tidak ada data pesanan yang ditemukan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, index) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500 text-center">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-600">{order.createdAt ? order.createdAt.toDate().toLocaleDateString('id-ID') : '-'}</div>
                          {order.createdBy && (
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Oleh: {order.createdBy}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            {order.studentName}
                            {getBenefitBadge(order)}
                          </div>
                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-1 mt-0.5">
                            <span className="font-bold text-slate-400 uppercase tracking-tighter mr-1">{order.gender}</span>
                            {order.items ? (
                              order.items.slice(0, 3).map((item, i) => (
                                <span key={i} className="bg-slate-100 px-1.5 rounded-sm border border-slate-200">
                                  {item.type ? `${item.type}(${item.name})` : item.name}
                                </span>
                              ))
                            ) : (
                              <span className="italic text-slate-400">Ukuran {order.uniformSize || '-'}</span>
                            )}
                            {order.items?.length > 3 && <span className="text-slate-300 font-black">+{order.items.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-900 font-medium">{order.guardianName}</div>
                          <div className="text-sm text-slate-500 truncate max-w-xs">{order.address}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-semibold tracking-tight">
                          Rp {order.grandTotal?.toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {order.remaining > 0 ? (
                            <span className="text-red-600 tracking-tight">Rp {order.remaining.toLocaleString('id-ID')}</span>
                          ) : (
                            <span className="text-emerald-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleWhatsApp(order)}
                              disabled={isProcessingWA === order.id}
                              className={`p-1.5 rounded-full transition-colors ${isProcessingWA === order.id ? 'text-slate-300 animate-pulse' : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
                              title="Kirim WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/edit-order/${order.id}`)}
                              className="text-blue-600 hover:text-blue-900 p-1.5 rounded-full hover:bg-blue-50 transition-colors"
                              title="Edit / Bayar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePrint(order)}
                              className="text-emerald-600 hover:text-emerald-900 p-1.5 rounded-full hover:bg-emerald-50 transition-colors"
                              title="Cetak Kuitansi"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                              title="Hapus Pesanan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
