import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavSection = ({ label, collapsed }) => (
  !collapsed && <div className="nav-section">{label}</div>
);

const NavItem = ({ to, icon, label, collapsed }) => (
  <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    <i className={`bi bi-${icon} fs-5`} />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

export default function Sidebar({ collapsed, toggle }) {
  const { user } = useAuth();
  const role = user?.role;

  const isAdmin   = role === 'admin';
  const isManager = role === 'manager';
  const isCashier = role === 'cashier';
  const canManage = isAdmin || isManager;

  return (
    <div className={`sidebar d-flex flex-column ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand d-flex align-items-center justify-content-between">
        {!collapsed && <Link to="/" className="text-white text-decoration-none"><i className="bi bi-shop me-2" />ShopManager</Link>}
        <button className="btn btn-sm text-white ms-auto" onClick={toggle}>
          <i className={`bi bi-${collapsed ? 'chevron-right' : 'chevron-left'}`} />
        </button>
      </div>

      <nav className="flex-grow-1 py-2 overflow-auto">

        {/* ── Masters ── admin + manager */}
        {canManage && (
          <>
            <NavSection label="Masters" collapsed={collapsed} />
            <NavItem to="/products"   icon="box-seam" label="Products"   collapsed={collapsed} />
            <NavItem to="/categories" icon="tags"     label="Categories" collapsed={collapsed} />
            <NavItem to="/suppliers"  icon="truck"    label="Suppliers"  collapsed={collapsed} />
            <NavItem to="/customers"  icon="people"   label="Customers"  collapsed={collapsed} />
          </>
        )}

        {/* ── Customers only ── cashier */}
        {isCashier && (
          <>
            <NavSection label="Masters" collapsed={collapsed} />
            <NavItem to="/customers" icon="people" label="Customers" collapsed={collapsed} />
          </>
        )}

        {/* ── Transactions ── all roles */}
        <NavSection label="Transactions" collapsed={collapsed} />
        <NavItem to="/sales"    icon="cart-check"  label="Sales"    collapsed={collapsed} />
        {canManage && <NavItem to="/purchases" icon="bag-plus"   label="Purchases" collapsed={collapsed} />}
        <NavItem to="/payments" icon="cash-stack"  label="Payments" collapsed={collapsed} />
        {canManage && (
          <>
            <NavItem to="/inventory" icon="archive"               label="Inventory"      collapsed={collapsed} />
            <NavItem to="/damages"   icon="exclamation-triangle"  label="Damages / Loss" collapsed={collapsed} />
          </>
        )}

        {/* ── Reports ── admin + manager */}
        {canManage && (
          <>
            <NavSection label="Reports" collapsed={collapsed} />
            <NavItem to="/reports/sales"         icon="graph-up"       label="Sales Report"     collapsed={collapsed} />
            <NavItem to="/reports/purchases"     icon="graph-down"     label="Purchase Report"  collapsed={collapsed} />
            <NavItem to="/reports/profit-loss"   icon="bar-chart"      label="Profit & Loss"    collapsed={collapsed} />
            <NavItem to="/reports/inventory"     icon="clipboard-data" label="Stock Report"     collapsed={collapsed} />
            <NavItem to="/reports/customer-due"  icon="person-x"       label="Customer Due"     collapsed={collapsed} />
            <NavItem to="/reports/batch-stock"   icon="layers"         label="Batch Stock"      collapsed={collapsed} />
            <NavItem to="/reports/purchase-bill" icon="receipt"        label="Bill-wise Report" collapsed={collapsed} />
          </>
        )}

        {/* ── Settings ── admin only */}
        {isAdmin && (
          <>
            <NavSection label="Settings" collapsed={collapsed} />
            <NavItem to="/users" icon="people-gear" label="User Management" collapsed={collapsed} />
          </>
        )}

      </nav>

    </div>
  );
}
