import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

const NavSection = ({ label, collapsed }) => (
  !collapsed && <div className="nav-section">{label}</div>
);

const NavItem = ({ to, icon, label, collapsed }) => (
  <NavLink to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    <i className={`bi bi-${icon} fs-5`} />
    {!collapsed && <span>{label}</span>}
  </NavLink>
);

const NavGroup = ({ icon, label, collapsed, children }) => {
  const [open, setOpen] = useState(false);
  if (collapsed) {
    return <>{children}</>;
  }
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="nav-link w-100 text-start d-flex align-items-center justify-content-between border-0 bg-transparent"
        style={{ gap: '0.5rem' }}
      >
        <span className="d-flex align-items-center" style={{ gap: '0.5rem' }}>
          <i className={`bi bi-${icon} fs-5`} />
          <span>{label}</span>
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} small`} />
      </button>
      {open && <div className="ps-3">{children}</div>}
    </div>
  );
};

export default function Sidebar({ collapsed, toggle }) {
  return (
    <div className={`sidebar d-flex flex-column ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand d-flex align-items-center justify-content-between">
        {!collapsed && <Link to="/" className="text-white text-decoration-none"><i className="bi bi-shop me-2" />ShopManager</Link>}
        <button className="btn btn-sm text-white ms-auto" onClick={toggle}>
          <i className={`bi bi-${collapsed ? 'chevron-right' : 'chevron-left'}`} />
        </button>
      </div>

      <nav className="flex-grow-1 py-2 overflow-auto">
        <NavSection label="Masters" collapsed={collapsed} />
        <NavGroup icon="collection" label="Masters" collapsed={collapsed}>
          <NavItem to="/products"    icon="box-seam"       label="Products"     collapsed={collapsed} />
          <NavItem to="/categories"  icon="tags"           label="Categories"   collapsed={collapsed} />
          <NavItem to="/suppliers"   icon="truck"          label="Suppliers"    collapsed={collapsed} />
          <NavItem to="/customers"   icon="people"         label="Customers"    collapsed={collapsed} />
        </NavGroup>

        <NavSection label="Transactions" collapsed={collapsed} />
        <NavGroup icon="arrow-left-right" label="Transactions" collapsed={collapsed}>
          <NavItem to="/sales"      icon="cart-check"          label="Sales"         collapsed={collapsed} />
          <NavItem to="/purchases"  icon="bag-plus"            label="Purchases"     collapsed={collapsed} />
          <NavItem to="/payments"   icon="cash-stack"          label="Payments"      collapsed={collapsed} />
          <NavItem to="/inventory"  icon="archive"             label="Inventory"     collapsed={collapsed} />
          <NavItem to="/damages"    icon="exclamation-triangle" label="Damages / Loss" collapsed={collapsed} />
        </NavGroup>

        <NavSection label="Reports" collapsed={collapsed} />
        <NavItem to="/reports/sales"       icon="graph-up"       label="Sales Report"    collapsed={collapsed} />
        <NavItem to="/reports/purchases"   icon="graph-down"     label="Purchase Report" collapsed={collapsed} />
        <NavItem to="/reports/profit-loss" icon="bar-chart"      label="Profit & Loss"   collapsed={collapsed} />
        <NavItem to="/reports/inventory"   icon="clipboard-data" label="Stock Report"    collapsed={collapsed} />
        <NavItem to="/reports/customer-due"icon="person-x"       label="Customer Due"    collapsed={collapsed} />
      </nav>
    </div>
  );
}
