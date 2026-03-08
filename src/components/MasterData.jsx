import React, { useState, useEffect } from 'react';
import { useMasterData } from '../context/MasterDataContext';
import { Plus, Trash2, Edit2, Save, X, Settings2, Package } from 'lucide-react';

const formatNumber = (num) => num ? num.toLocaleString('id-ID') : '0';
const parseNumber = (str) => {
  const numeric = String(str).replace(/[^0-9]/g, '');
  return numeric ? parseInt(numeric, 10) : 0;
};

export default function MasterData() {
  const { categories: masterCategories, loading, saveMasterData } = useMasterData();
  const [localCategories, setLocalCategories] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (masterCategories) {
      setLocalCategories(masterCategories.map(cat => ({
        ...cat,
        items: [...cat.items]
      })));
    }
  }, [masterCategories]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveMasterData(localCategories);
    setIsSaving(false);
    if (result.success) {
      alert("Data Master berhasil disimpan!");
    } else {
      alert("Gagal menyimpan Data Master: " + result.error);
    }
  };

  const addCategory = (type = 'flat') => {
    const newId = 'cat-' + Date.now();
    const newCat = {
      id: newId,
      name: `Kategori Baru ${localCategories.length + 1}`,
      type: type,
      items: type === 'grouped' 
        ? [{ id: 'u-' + Date.now(), type: 'Grup Baru', name: 'S', price: 0 }]
        : [{ id: 'a-' + Date.now(), name: 'Item Baru', price: 0, forGender: 'Semua', removable: true }]
    };
    setLocalCategories([...localCategories, newCat]);
  };

  const removeCategory = (id) => {
    if (window.confirm("Hapus kategori ini beserta seluruh isinya?")) {
      setLocalCategories(localCategories.filter(c => c.id !== id));
    }
  };

  const updateCategoryName = (id, newName) => {
    setLocalCategories(localCategories.map(c => c.id === id ? { ...c, name: newName } : c));
  };

  // --- Sub-item handlers for Grouped Type (Uniforms) ---
  const handleTypeChangeInGroup = (catId, oldType, newType) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(item => item.type === oldType ? { ...item, type: newType } : item)
        };
      }
      return c;
    }));
  };

  const addVariantToGroup = (catId, groupType) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, { id: 'u-' + Date.now(), type: groupType, name: 'Baru', price: 0 }]
        };
      }
      return c;
    }));
  };

  const addGroupToCategory = (catId) => {
    const newType = 'Grup Baru ' + Date.now().toString().slice(-4);
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, { id: 'u-' + Date.now(), type: newType, name: 'S', price: 0 }]
        };
      }
      return c;
    }));
  };

  const handleVariantChange = (catId, vId, field, value) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(v => v.id === vId ? { ...v, [field]: value } : v)
        };
      }
      return c;
    }));
  };

  const removeVariant = (catId, vId) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.filter(v => v.id !== vId)
        };
      }
      return c;
    }));
  };

  const removeGroupFromCategory = (catId, groupType) => {
    if (window.confirm(`Hapus grup "${groupType}"?`)) {
      setLocalCategories(localCategories.map(c => {
        if (c.id === catId) {
          return {
            ...c,
            items: c.items.filter(item => item.type !== groupType)
          };
        }
        return c;
      }));
    }
  };

  // --- Sub-item handlers for Flat Type (Attributes) ---
  const handleFlatItemChange = (catId, itemId, field, value) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        };
      }
      return c;
    }));
  };

  const addFlatItem = (catId) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: [...c.items, { id: 'a-' + Date.now(), name: 'Item Baru', price: 0, forGender: 'Semua', removable: true }]
        };
      }
      return c;
    }));
  };

  const removeFlatItem = (catId, itemId) => {
    setLocalCategories(localCategories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          items: c.items.filter(item => item.id !== itemId)
        };
      }
      return c;
    }));
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">Memuat Data Master...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-emerald-600" /> Pengaturan Data Master
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gunakan halaman ini untuk menambah kategori (A, B, C...) dan mengelola isinya.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex border border-emerald-200 rounded-xl overflow-hidden bg-white shadow-sm w-full sm:w-auto">
            <button onClick={() => addCategory('grouped')} className="flex-1 px-3 py-3 text-[10px] font-bold text-emerald-700 hover:bg-emerald-50 border-r border-emerald-100 flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-3 h-3" /> Berjenjang
            </button>
            <button onClick={() => addCategory('flat')} className="flex-1 px-3 py-3 text-[10px] font-bold text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-3 h-3" /> Satuan
            </button>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-100 active:scale-95"
          >
            <Save className="w-5 h-5" />
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {localCategories.map((cat, catIdx) => (
          <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Category Header */}
            <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cat.type === 'grouped' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl border-2 shadow-sm bg-white ${cat.type === 'grouped' ? 'border-emerald-200 text-slate-900' : 'border-blue-200 text-slate-900'}`}>
                  {catIdx + 1}
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={cat.name} 
                    onChange={(e) => updateCategoryName(cat.id, e.target.value)}
                    className="bg-transparent border-none focus:ring-0 text-xl font-bold text-slate-800 p-0 w-full placeholder:text-slate-300"
                    placeholder="Nama Kategori..."
                  />
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${cat.type === 'grouped' ? 'bg-emerald-200 text-emerald-800' : 'bg-blue-200 text-blue-800'}`}>
                      {cat.type === 'grouped' ? 'Tipe Berjenjang (Grouped)' : 'Tipe Satuan (Flat)'}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => removeCategory(cat.id)}
                className="self-end sm:self-center p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors group"
                title="Hapus Kategori"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-50/20">
              {cat.type === 'grouped' ? (
                // --- Grouped Editor (Uniforms Style) ---
                <div className="space-y-8">
                  <div className="flex justify-start">
                    <button onClick={() => addGroupToCategory(cat.id)} className="text-sm bg-white border border-emerald-200 text-emerald-600 font-bold hover:bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition-all">
                      <Plus className="w-4 h-4" /> Tambah Kelompok Baru
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* Unique types in this category */}
                    {Array.from(new Set(cat.items.map(i => i.type))).map((groupType, gIdx) => (
                      <div key={groupType} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900">{gIdx + 1}.</span>
                            <input 
                              type="text" 
                              value={groupType} 
                              onChange={(e) => handleTypeChangeInGroup(cat.id, groupType, e.target.value)}
                              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 w-full truncate"
                            />
                          </div>
                          <button onClick={() => removeGroupFromCategory(cat.id, groupType)} className="p-1 text-slate-300 hover:text-red-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-3 space-y-2 flex-1">
                          {cat.items.filter(i => i.type === groupType).map((v, vIdx) => (
                            <div key={v.id} className="flex items-center gap-2 group/variant">
                              <span className="text-[10px] font-bold text-slate-900 w-4">{vIdx + 1}.</span>
                              <input 
                                type="text" 
                                value={v.name} 
                                onChange={(e) => handleVariantChange(cat.id, v.id, 'name', e.target.value)}
                                className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded focus:ring-emerald-500 text-center uppercase font-medium"
                              />
                              <div className="flex-1 relative">
                                <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-[10px] text-slate-400">Rp</span>
                                <input 
                                  type="text" 
                                  value={v.price === 0 ? '' : formatNumber(v.price)} 
                                  onChange={(e) => handleVariantChange(cat.id, v.id, 'price', parseNumber(e.target.value))}
                                  className="w-full pl-6 pr-1.5 py-1 text-right text-xs border border-slate-200 rounded focus:ring-emerald-500 font-semibold"
                                />
                              </div>
                              <button onClick={() => removeVariant(cat.id, v.id)} className="p-1 text-slate-200 hover:text-red-400">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addVariantToGroup(cat.id, groupType)} className="w-full py-1.5 mt-2 border border-dashed border-slate-200 rounded text-[10px] font-bold text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-1">
                            <Plus className="w-3 h-3" /> Tambah Ukuran
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // --- Flat Editor (Attributes Style) ---
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cat.items.map((item, idx) => (
                    <div key={item.id} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm relative group/item">
                      <button onClick={() => removeFlatItem(cat.id, item.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-xs font-bold text-slate-900 mt-1">{idx + 1}.</span>
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nama Item</label>
                          <input 
                            type="text" 
                            value={item.name} 
                            onChange={(e) => handleFlatItemChange(cat.id, item.id, 'name', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm font-semibold border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Gender</label>
                          <select 
                            value={item.forGender || 'Semua'} 
                            onChange={(e) => handleFlatItemChange(cat.id, item.id, 'forGender', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-blue-500"
                          >
                            <option value="Semua">Semua</option>
                            <option value="Putri">Putri</option>
                            <option value="Putra">Putra</option>
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Harga (Rp)</label>
                          <input 
                            type="text" 
                            value={item.price === 0 ? '' : formatNumber(item.price)} 
                            onChange={(e) => handleFlatItemChange(cat.id, item.id, 'price', parseNumber(e.target.value))}
                            className="w-full px-2 py-1.5 text-sm text-right font-bold border border-slate-200 rounded-lg focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addFlatItem(cat.id)} className="h-full min-h-[120px] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                    <Plus className="w-6 h-6 group-hover:scale-125 transition-transform" />
                    <span className="text-sm font-bold">Tambah Item Satuan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {localCategories.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-400">Belum ada kategori master.</h3>
            <p className="text-slate-400 text-sm mb-6">Tambahkan kategori baru untuk memulai.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => addCategory('grouped')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-all">
                + Kategori Berjenjang
              </button>
              <button onClick={() => addCategory('flat')} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all">
                + Kategori Satuan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
