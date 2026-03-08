import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';

const OrderContext = createContext();

export const useOrders = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch all orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const ordersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Add a new order
  const addOrder = async (orderData) => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: Timestamp.now()
      });
      // Update local state
      setOrders(prev => [{ id: docRef.id, ...orderData, createdAt: Timestamp.now() }, ...prev]);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error adding order: ", error);
      return { success: false, error };
    }
  };

  // Update an existing order
  const updateOrder = async (id, updatedData) => {
    try {
      const docRef = doc(db, "orders", id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: Timestamp.now()
      });
      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, ...updatedData, updatedAt: Timestamp.now() } : order
      ));
      return { success: true };
    } catch (error) {
      console.error("Error updating order: ", error);
      return { success: false, error };
    }
  };

  // Delete an order
  const deleteOrder = async (id) => {
    try {
      const docRef = doc(db, "orders", id);
      await deleteDoc(docRef);
      // Update local state
      setOrders(prev => prev.filter(order => order.id !== id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting order: ", error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    // We could fetch initially, but let's just make it available to call when dashboard mounts
    // fetchOrders();
  }, []);

  const value = {
    orders,
    loadingOrders,
    fetchOrders,
    addOrder,
    updateOrder,
    deleteOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
