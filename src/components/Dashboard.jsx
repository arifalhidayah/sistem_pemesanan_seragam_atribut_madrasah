import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { Printer, Search, FileText, Edit, Trash2, MessageSquare } from 'lucide-react';
import { generateInvoicePDF } from '../utils/PdfGenerator';
import { uploadAndGetWhatsAppLink } from '../utils/WhatsAppUtils';

export default function Dashboard() {
  const { orders, fetchOrders, loadingOrders, deleteOrder } = useOrders();
  const { categories: masterCategories } = useMasterData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessingWA, setIsProcessingWA] = useState(null); // ID of order being processed
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredOrders = orders.filter(
    order =>
      order.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guardianName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              placeholder="Cari nama siswa / wali..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Siswa</div>
                  <div className="text-lg font-black text-slate-900 leading-tight">{order.studentName}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <div className="text-sm font-medium text-slate-500">{order.gender} • {order.createdAt?.toDate().toLocaleDateString('id-ID')}</div>
                    {getBenefitBadge(order)}
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Wali / Alamat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Sisa Tagihan
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">
                        Memuat data pesanan...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-8 text-center text-sm text-slate-500">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="w-8 h-8 text-slate-300" />
                          <p>Tidak ada data pesanan yang ditemukan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
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
