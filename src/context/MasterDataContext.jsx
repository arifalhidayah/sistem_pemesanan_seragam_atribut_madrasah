import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ATTRIBUTE_ITEMS_DEFAULT, UNIFORM_PRICES } from '../data/constants';

const MasterDataContext = createContext();

export function useMasterData() {
  return useContext(MasterDataContext);
}

export function MasterDataProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default values for initialization if completely empty
  const getDefaultCategories = () => [
    {
      id: 'cat-uniforms',
      name: 'Kategori A: Seragam',
      type: 'grouped', // types: 'grouped' (for sizes), 'flat' (for single items)
      items: Object.entries(UNIFORM_PRICES).map(([size, price]) => ({
        id: 'u-' + size,
        type: 'Seragam Standar',
        name: size,
        price: price,
      }))
    },
    {
      id: 'cat-attributes',
      name: 'Kategori B: Atribut & Kegiatan',
      type: 'flat',
      items: ATTRIBUTE_ITEMS_DEFAULT.map(item => ({ ...item }))
    }
  ];

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'masterData');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // MIGRATION LOGIC: check if using the new 'categories' format
        if (data.categories) {
          setCategories(data.categories);
        } else {
          // Conver old 'uniforms' and 'attributes' to 'categories'
          const migrated = [
            {
              id: 'cat-uniforms',
              name: 'Kategori A: Seragam',
              type: 'grouped',
              items: (data.uniforms || []).map(u => ({ ...u, type: u.type || 'Seragam Standar' }))
            },
            {
              id: 'cat-attributes',
              name: 'Kategori B: Atribut & Kegiatan',
              type: 'flat',
              items: (data.attributes || [])
            }
          ];
          setCategories(migrated);
        }
      } else {
        const defaults = getDefaultCategories();
        await setDoc(docRef, { categories: defaults });
        setCategories(defaults);
      }
    } catch (err) {
      console.error("Error fetching master data:", err);
      setCategories(getDefaultCategories());
    } finally {
      setLoading(false);
    }
  };

  const saveMasterData = async (newCategories) => {
    try {
      const docRef = doc(db, 'settings', 'masterData');
      await setDoc(docRef, { categories: newCategories });
      setCategories(newCategories);
      return { success: true };
    } catch (err) {
      console.error("Error saving master data:", err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchMasterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    categories,
    loading,
    saveMasterData,
    fetchMasterData
  };

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}
