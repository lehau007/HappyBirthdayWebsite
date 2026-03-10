import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Page1Fireworks from './pages/Page1Fireworks'
import Page2Flowers from './pages/Page2Flowers'
import Page3Poem from './pages/Page3Poem'
import Page4Feedback from './pages/Page4Feedback'
import AdminDashboard from './pages/AdminDashboard'
import RootAdminDashboard from './pages/RootAdminDashboard'

function RequireAuth({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/" replace />
  return <>{children}</>
}

function RoleHome() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'root_admin') return <Navigate to="/root-admin" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/page1" replace />
}

function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RoleHome />} />

        {/* Normal user flow */}
        <Route path="/page1" element={
          <RequireAuth roles={['normal_user']}><Page1Fireworks /></RequireAuth>
        } />
        <Route path="/page2" element={
          <RequireAuth roles={['normal_user']}><Page2Flowers /></RequireAuth>
        } />
        <Route path="/page3" element={
          <RequireAuth roles={['normal_user']}><Page3Poem /></RequireAuth>
        } />
        <Route path="/page4" element={
          <RequireAuth roles={['normal_user']}><Page4Feedback /></RequireAuth>
        } />

        {/* Admin */}
        <Route path="/admin" element={
          <RequireAuth roles={['admin']}><AdminDashboard /></RequireAuth>
        } />

        {/* Root admin */}
        <Route path="/root-admin" element={
          <RequireAuth roles={['root_admin']}><RootAdminDashboard /></RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
