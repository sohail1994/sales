import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import ProductList from './pages/Products/ProductList';
import ProductForm from './pages/Products/ProductForm';
import SaleList from './pages/Sales/SaleList';
import NewSale from './pages/Sales/NewSale';
import SaleDetail from './pages/Sales/SaleDetail';
import PurchaseList from './pages/Purchases/PurchaseList';
import NewPurchase from './pages/Purchases/NewPurchase';
import PurchaseDetail from './pages/Purchases/PurchaseDetail';
import Inventory from './pages/Inventory/Inventory';
import SalesReport from './pages/Reports/SalesReport';
import PurchaseReport from './pages/Reports/PurchaseReport';
import ProfitLoss from './pages/Reports/ProfitLoss';
import InventoryReport from './pages/Reports/InventoryReport';
import CustomerDue from './pages/Reports/CustomerDue';
import Payments from './pages/Payments/Payments';
import PaymentReminders from './pages/Payments/PaymentReminders';
import Categories from './pages/Categories/Categories';
import Suppliers from './pages/Suppliers/Suppliers';
import Damages from './pages/Damages/Damages';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/:id/edit" element={<CustomerForm />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="sales" element={<SaleList />} />
            <Route path="sales/new" element={<NewSale />} />
            <Route path="sales/:id" element={<SaleDetail />} />
            <Route path="purchases" element={<PurchaseList />} />
            <Route path="purchases/new" element={<NewPurchase />} />
            <Route path="purchases/:id" element={<PurchaseDetail />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports/sales" element={<SalesReport />} />
            <Route path="reports/purchases" element={<PurchaseReport />} />
            <Route path="reports/profit-loss" element={<ProfitLoss />} />
            <Route path="reports/inventory" element={<InventoryReport />} />
            <Route path="reports/customer-due" element={<CustomerDue />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payments/reminders" element={<PaymentReminders />} />
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="damages" element={<Damages />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
