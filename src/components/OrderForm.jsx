import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { useMasterData } from '../context/MasterDataContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, Save, Printer, ArrowLeft, Edit2, Plus, X, Check, MessageSquare } from 'lucide-react';
import { generateInvoicePDF } from '../utils/PdfGenerator';
import { uploadAndGetWhatsAppLink } from '../utils/WhatsAppUtils';

// formatting utilities
const formatNumber = (num) => num ? num.toLocaleString('id-ID') : '';
const parseNumber = (str) => {
  const numeric = String(str).replace(/[^0-9]/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
};

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addOrder, updateOrder, orders, fetchOrders } = useOrders();
  const { categories: masterCategories, loading: loadingMaster } = useMasterData();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    guardianName: '',
    studentName: '',
    address: '',
    gender: 'Putri',
    whatsappNumber: '',
  });
  
  // Selections state: { [categoryId]: [selectedItem1, selectedItem2, ...] }
  const [selectedItemsMap, setSelectedItemsMap] = useState({});
  
  const [discount, setDiscount] = useState(0);
  const [currentPayment, setCurrentPayment] = useState(0);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (orders.length === 0) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize data for Edit Mode or Defaults
  useEffect(() => {
    if (loadingMaster || !masterCategories || masterCategories.length === 0) return;

    if (id && orders.length > 0 && !isEditMode) {
       const existingOrder = orders.find(o => o.id === id);
       if (existingOrder) {
         setIsEditMode(true);
         setFormData({
           guardianName: existingOrder.guardianName || '',
           studentName: existingOrder.studentName || '',
           address: existingOrder.address || '',
           gender: existingOrder.gender || 'Putri',
           whatsappNumber: existingOrder.whatsappNumber || '',
         });
         
         const initSelections = {};
         
         // Try new structure first
         if (existingOrder.categoriesSelections) {
            setSelectedItemsMap(existingOrder.categoriesSelections);
         } else {
            // MIGRATION: Convert old uniforms/attributes to category selections
            // Find the cat-uniforms and cat-attributes if they exist
            const uniCat = masterCategories.find(c => c.id === 'cat-uniforms' || c.type === 'grouped');
            const attrCat = masterCategories.find(c => c.id === 'cat-attributes' || c.type === 'flat');
            
            if (uniCat && existingOrder.uniforms) {
              initSelections[uniCat.id] = existingOrder.uniforms;
            }
            if (attrCat && existingOrder.attributes) {
              initSelections[attrCat.id] = existingOrder.attributes;
            }
            setSelectedItemsMap(initSelections);
         }
         
         setDiscount(existingOrder.discount || 0);
         setPaymentHistory(existingOrder.paymentHistory || []);
         setCurrentPayment(0);
       }
    }
  }, [id, orders, isEditMode, loadingMaster, masterCategories]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Selection handlers
  const toggleGroupedSelection = (catId, groupType, itemId) => {
    const category = masterCategories.find(c => c.id === catId);
    const item = category.items.find(i => i.id === itemId);
    
    setSelectedItemsMap(prev => {
      const current = prev[catId] || [];
      // Replace existing selection for this groupType
      const filtered = current.filter(i => i.type !== groupType);
      if (itemId === "") return { ...prev, [catId]: filtered };
      return { ...prev, [catId]: [...filtered, item] };
    });
  };

  const toggleFlatSelection = (catId, itemId) => {
    const category = masterCategories.find(c => c.id === catId);
    const item = category.items.find(i => i.id === itemId);
    
    setSelectedItemsMap(prev => {
      const current = prev[catId] || [];
      const exists = current.find(i => i.id === itemId);
      if (exists) {
        return { ...prev, [catId]: current.filter(i => i.id !== itemId) };
      }
      return { ...prev, [catId]: [...current, item] };
    });
  };

  // Calculate totals
  const subTotal = Object.values(selectedItemsMap).flat().reduce((sum, item) => sum + (item.price || 0), 0);
  const grandTotal = Math.max(0, subTotal - discount);
  const totalPastPayments = paymentHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAmountPaid = totalPastPayments + currentPayment;
  const remaining = Math.max(0, grandTotal - totalAmountPaid);

  const getStatus = () => {
    if (totalAmountPaid === 0) return { label: 'Belum Bayar', color: 'bg-red-100 text-red-800' };
    if (totalAmountPaid < grandTotal) return { label: 'Belum Lunas', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Lunas', color: 'bg-emerald-100 text-emerald-800' };
  };

  const status = getStatus();

  const handleSaveOnly = async (e) => {
    e.preventDefault();
    await handleProcessSave('save');
  };

  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    await handleProcessSave('print');
  };

  const handleSaveAndWhatsApp = async (e) => {
    e.preventDefault();
    await handleProcessSave('whatsapp');
  };

  const handleProcessSave = async (mode) => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      const adminName = currentUser?.displayName || currentUser?.email || 'System';

      const newPaymentHistory = [...paymentHistory];
      if (currentPayment > 0) {
        newPaymentHistory.push({
          date: new Date().toISOString(),
          amount: currentPayment,
          receivedBy: adminName
        });
      }

      const allSelectedItems = Object.entries(selectedItemsMap).flatMap(([catId, items]) => {
        const cat = masterCategories.find(c => c.id === catId);
        return items.map(item => ({
          ...item,
          categoryName: cat ? cat.name : 'Lainnya',
          categoryId: catId
        }));
      });

      const orderData = {
        ...formData,
        categoriesSelections: selectedItemsMap,
        items: allSelectedItems,
        uniforms: allSelectedItems.filter(i => i.categoryId === 'cat-uniforms' || i.type === 'Seragam Standar' || (i.categoryName && i.categoryName.includes('Seragam'))),
        attributes: allSelectedItems.filter(i => i.categoryId === 'cat-attributes' || (i.categoryName && !i.categoryName.includes('Seragam'))),
        subTotal,
        discount,
        grandTotal,
        amountPaid: totalAmountPaid,
        paymentHistory: newPaymentHistory,
        remaining,
        status: status.label,
        updatedBy: adminName,
        ...(isEditMode ? {} : { createdBy: adminName })
      };

      // Basic Validation
      if (!orderData.studentName || !orderData.guardianName) {
        alert("Nama siswa dan wali wajib diisi.");
        return;
      }

      let result;
      if (isEditMode) {
        result = await updateOrder(id, orderData);
        result.id = id;
      } else {
        result = await addOrder(orderData);
      }
      
      if (result.success) {
        if (mode === 'print') {
          console.log("Triggering PDF Local Print...");
          generateInvoicePDF({ ...orderData, id: result.id });
          alert("Berhasil menyimpan! PDF sedang didownload.");
        } else if (mode === 'whatsapp') {
          console.log("Triggering WhatsApp PDF & Local Print Process...");
          // shouldSave = true so it downloads locally AND returns blob for WA
          const pdfBlob = generateInvoicePDF({ ...orderData, id: result.id }, true);
          if (orderData.whatsappNumber && pdfBlob) {
            const waUrl = await uploadAndGetWhatsAppLink({ ...orderData, id: result.id }, pdfBlob);
            if (waUrl) {
              window.open(waUrl, '_blank');
              alert("Berhasil menyimpan! Bukti dicetak & membuka WhatsApp...");
            } else {
              alert("Berhasil menyimpan & Cetak bukti, tapi gagal mengunggah ke cloud untuk WA.");
            }
          } else {
            alert("Berhasil menyimpan & Cetak bukti, tapi No WA kosong.");
          }
        } else {
          alert("Data berhasil disimpan.");
        }
        
        // Final delay or wait for user to click OK on alert before navigating
        navigate('/');
      } else {
        alert("Gagal menyimpan data pesanan: " + (result.error?.message || "Error tidak diketahui"));
      }
    } catch (err) {
      console.error("Save process error:", err);
      alert("Terjadi kesalahan sistem saat menyimpan. Cek koneksi internet Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors text-slate-600">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
          {isEditMode ? 'Edit / Pelunasan' : 'Form Pemesanan'}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Data Diri */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Informasi Siswa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Wali Murid</label>
              <input type="text" name="guardianName" required value={formData.guardianName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Nama wali" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Siswa</label>
              <input type="text" name="studentName" required value={formData.studentName} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Nama siswa" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
              <textarea name="address" required value={formData.address} onChange={handleInputChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Alamat lengkap" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                <option value="Putri">Putri</option>
                <option value="Putra">Putra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp Wali</label>
              <input 
                type="text" 
                name="whatsappNumber" 
                value={formData.whatsappNumber} 
                onChange={handleInputChange} 
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-emerald-700 font-bold" 
                placeholder="081234..." 
              />
            </div>
          </div>
        </div>

        {/* Dynamic Categories */}
        {loadingMaster ? (
          <div className="bg-white p-8 text-center text-slate-500 rounded-xl border border-dashed border-slate-200">Memuat rincian pembelian...</div>
        ) : (
          masterCategories.map((cat, catIdx) => (
            <div key={cat.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex justify-between items-center">
                <span>{cat.name}</span>
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Rp {(selectedItemsMap[cat.id] || []).reduce((sum, item) => sum + (item.price || 0), 0).toLocaleString('id-ID')}
                </span>
              </h2>

              {cat.type === 'grouped' ? (
                // Grouped Render (Like Uniforms)
                <div className="divide-y divide-slate-100 border rounded-lg overflow-hidden">
                  {Object.entries(
                    cat.items.reduce((acc, item) => {
                      if (!acc[item.type]) acc[item.type] = [];
                      acc[item.type].push(item);
                      return acc;
                    }, {})
                  ).map(([groupType, items], gIdx) => {
                    const currentSelection = (selectedItemsMap[cat.id] || []).find(i => i.type === groupType);
                    return (
                      <div key={groupType} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-slate-50 gap-2">
                        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-bold text-slate-400 w-5">{gIdx + 1}.</span>
                          <label className="text-sm font-medium text-slate-700 flex-1 sm:max-w-[150px] md:max-w-[200px] truncate" title={groupType}>{groupType}:</label>
                          <select 
                            value={currentSelection?.id || ''} 
                            onChange={(e) => toggleGroupedSelection(cat.id, groupType, e.target.value)}
                            className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 border border-slate-300 rounded-md text-sm truncate"
                          >
                            <option value="">-- Tidak Pesan --</option>
                            {items.map(u => (
                              <option key={u.id} value={u.id}>Ukuran {u.name} (Rp {u.price.toLocaleString('id-ID')})</option>
                            ))}
                          </select>
                        </div>
                        <div className="text-right font-bold text-slate-800 sm:min-w-[100px] text-sm">
                          {currentSelection ? `Rp ${currentSelection.price.toLocaleString('id-ID')}` : '-'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Flat Render (Like Attributes)
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.items
                    .filter(item => !item.forGender || item.forGender === 'Semua' || item.forGender === formData.gender)
                    .map((item, iIdx) => {
                      const isSelected = (selectedItemsMap[cat.id] || []).some(i => i.id === item.id);
                      return (
                        <button 
                          key={item.id}
                          type="button"
                          onClick={() => toggleFlatSelection(cat.id, item.id)}
                          className={`p-3 text-left border rounded-xl transition-all flex flex-col justify-between h-full ${isSelected ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 shadow-sm' : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400">{iIdx + 1}.</span>
                             {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                          <div>
                            <div className={`text-sm font-semibold mb-1 leading-tight ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{item.name}</div>
                            <div className={`text-xs font-bold ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`}>Rp {item.price.toLocaleString('id-ID')}</div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ))
        )}

        {/* Total & Pembayaran */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Pembayaran</h2>
          <div className="space-y-3 w-full sm:max-w-sm sm:ml-auto">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-800 font-bold">Rp {subTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <label className="text-sm font-medium text-slate-500">Potongan Harga</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input 
                  type="text" 
                  value={discount === 0 ? '' : formatNumber(discount)} 
                  onChange={(e) => setDiscount(parseNumber(e.target.value))}
                  className="w-32 pl-9 pr-3 py-1.5 text-right font-bold text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-between items-center py-3 bg-slate-50 px-4 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800">TOTAL BIAYA</span>
              <span className="text-xl font-black text-emerald-600">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
            
            {isEditMode && paymentHistory.length > 0 && (
              <div className="py-2 border-t border-slate-100 mt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Riwayat Pembayaran</p>
                <div className="space-y-1">
                  {paymentHistory.map((p, i) => (
                    <div key={i} className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">{new Date(p.date).toLocaleDateString('id-ID')}</span>
                      <span className="text-slate-900 font-bold">Rp {p.amount.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200">
                    <span>SEBELUMNYA</span>
                    <span>Rp {totalPastPayments.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-4">
              <label className="text-sm font-bold text-slate-700">{isEditMode ? 'Tambah Pembayaran' : 'Nominal Pembayaran'}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">Rp</span>
                <input 
                  type="text" 
                  required
                  value={currentPayment === 0 ? '' : formatNumber(currentPayment)} 
                  onChange={(e) => setCurrentPayment(parseNumber(e.target.value))}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 text-right font-black text-xl sm:text-2xl text-slate-900 border-2 border-emerald-500 bg-emerald-50/30 rounded-2xl focus:ring-4 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm pt-4 font-bold">
              <span className="text-slate-500">SISA TAGIHAN</span>
              <span className={`${remaining > 0 ? 'text-red-500 underline' : 'text-emerald-600'} text-right ml-2`}>Rp {remaining.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
               <span className="text-xs font-bold text-slate-400">STATUS</span>
               <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-widest ${status.color}`}>{status.label}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
          <button 
            type="button"
            onClick={handleSaveOnly}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all disabled:opacity-50 active:scale-95"
          >
            <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? 'MEMPROSES...' : 'SIMPAN SAJA'}</span>
          </button>
          
          <button 
            type="button"
            onClick={handleSaveAndPrint}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50 active:scale-95"
          >
            <Printer className={`w-5 h-5 ${isSaving ? 'animate-pulse' : ''}`} />
            <span>{isSaving ? 'MEMPROSES...' : 'SIMPAN & CETAK'}</span>
          </button>

          <button 
            type="button"
            onClick={handleSaveAndWhatsApp}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-emerald-200 disabled:opacity-50 active:scale-95"
          >
            <MessageSquare className={`w-5 h-5 ${isSaving ? 'animate-bounce' : ''}`} />
            <span>{isSaving ? 'MEMPROSES...' : 'SIMPAN & KIRIM WA'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
