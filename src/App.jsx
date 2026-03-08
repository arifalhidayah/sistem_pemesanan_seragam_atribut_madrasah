import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrderProvider } from './context/OrderContext';

import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import Report from './components/Report';
import MasterData from './components/MasterData';
import Profile from './components/Profile';
import { MasterDataProvider } from './context/MasterDataContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MasterDataProvider>
          <OrderProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="new-order" element={<OrderForm />} />
                <Route path="edit-order/:id" element={<OrderForm />} />
                <Route path="report" element={<Report />} />
                <Route path="master" element={<MasterData />} />
                <Route path="profile" element={<Profile />} />
              </Route>
            </Routes>
          </OrderProvider>
        </MasterDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
