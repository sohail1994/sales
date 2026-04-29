import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import RoleRoute from './components/RoleRoute';
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
import BatchReport from './pages/Reports/BatchReport';
import PurchaseBillReport from './pages/Reports/PurchaseBillReport';
import Payments from './pages/Payments/Payments';
import PaymentReminders from './pages/Payments/PaymentReminders';
import Categories from './pages/Categories/Categories';
import Suppliers from './pages/Suppliers/Suppliers';
import Damages from './pages/Damages/Damages';
import Users from './pages/Users/Users';

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

            {/* Customers — all roles */}
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/new" element={<CustomerForm />} />
            <Route path="customers/:id/edit" element={<CustomerForm />} />

            {/* Products — admin + manager */}
            <Route path="products" element={<RoleRoute roles={['admin','manager']}><ProductList /></RoleRoute>} />
            <Route path="products/new" element={<RoleRoute roles={['admin','manager']}><ProductForm /></RoleRoute>} />
            <Route path="products/:id/edit" element={<RoleRoute roles={['admin','manager']}><ProductForm /></RoleRoute>} />

            {/* Sales — all roles */}
            <Route path="sales" element={<SaleList />} />
            <Route path="sales/new" element={<NewSale />} />
            <Route path="sales/:id" element={<SaleDetail />} />

            {/* Purchases — admin + manager */}
            <Route path="purchases" element={<RoleRoute roles={['admin','manager']}><PurchaseList /></RoleRoute>} />
            <Route path="purchases/new" element={<RoleRoute roles={['admin','manager']}><NewPurchase /></RoleRoute>} />
            <Route path="purchases/:id" element={<RoleRoute roles={['admin','manager']}><PurchaseDetail /></RoleRoute>} />

            {/* Inventory & Damages — admin + manager */}
            <Route path="inventory" element={<RoleRoute roles={['admin','manager']}><Inventory /></RoleRoute>} />
            <Route path="damages" element={<RoleRoute roles={['admin','manager']}><Damages /></RoleRoute>} />

            {/* Payments — all roles */}
            <Route path="payments" element={<Payments />} />
            <Route path="payments/reminders" element={<PaymentReminders />} />

            {/* Masters — admin + manager */}
            <Route path="categories" element={<RoleRoute roles={['admin','manager']}><Categories /></RoleRoute>} />
            <Route path="suppliers" element={<RoleRoute roles={['admin','manager']}><Suppliers /></RoleRoute>} />

            {/* Reports — admin + manager */}
            <Route path="reports/sales" element={<RoleRoute roles={['admin','manager']}><SalesReport /></RoleRoute>} />
            <Route path="reports/purchases" element={<RoleRoute roles={['admin','manager']}><PurchaseReport /></RoleRoute>} />
            <Route path="reports/profit-loss" element={<RoleRoute roles={['admin','manager']}><ProfitLoss /></RoleRoute>} />
            <Route path="reports/inventory" element={<RoleRoute roles={['admin','manager']}><InventoryReport /></RoleRoute>} />
            <Route path="reports/customer-due" element={<RoleRoute roles={['admin','manager']}><CustomerDue /></RoleRoute>} />
            <Route path="reports/batch-stock" element={<RoleRoute roles={['admin','manager']}><BatchReport /></RoleRoute>} />
            <Route path="reports/purchase-bill" element={<RoleRoute roles={['admin','manager']}><PurchaseBillReport /></RoleRoute>} />

            {/* User Management — admin only */}
            <Route path="users" element={<RoleRoute roles={['admin']}><Users /></RoleRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
