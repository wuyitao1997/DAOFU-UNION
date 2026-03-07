/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/admin/AdminLogin';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import Profile from './pages/user/Profile';
import Dashboard from './pages/user/Dashboard';
import Products from './pages/user/Products';
import Stats from './pages/user/Stats';
import Tools from './pages/user/Tools';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';
import AdminActivities from './pages/admin/Activities';
import AdminOrders from './pages/admin/Orders';
import AdminSettlements from './pages/admin/Settlements';
import JDAuth from './pages/admin/JDAuth';
import JDActivities from './pages/admin/JDActivities';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="profile" element={<Profile />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="stats" element={<Stats />} />
          <Route path="tools" element={<Tools />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="settlements" element={<AdminSettlements />} />
          <Route path="jd-auth" element={<JDAuth />} />
          <Route path="jd-activities" element={<JDActivities />} />
        </Route>
      </Routes>
    </Router>
  );
}
