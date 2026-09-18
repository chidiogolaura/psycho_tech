import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { auth } from './firebase'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/app/Dashboard'
import Profile from './pages/app/Profile'
import Assessment from './pages/app/Assessment'
import Community from './pages/app/Community'
import Navbar from './components/Navbar'
import History from './pages/app/History'

// Admin imports
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPosts from './pages/admin/AdminPosts'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'
import AdminSettings from './pages/admin/AdminSettings'

// Regular user layout with Navbar
function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ 
        flex: 1, 
        marginLeft: '260px',
        background: 'linear-gradient(135deg, #FAF8FF 0%, #FFFFFF 100%)',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  )
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true)
          setIsAdmin(tokenResult.claims.admin === true)
          console.log('🔍 App: Is Admin?', tokenResult.claims.admin === true)
        } catch (error) {
          console.error('Error checking admin status:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: '#FAF8FF'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid #F3F0FF', 
            borderTopColor: '#7B6CB7', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6B6B7A' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================ */}
        {/* PUBLIC ROUTES (No Layout)                    */}
        {/* ============================================ */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* ============================================ */}
        {/* ADMIN ROUTES (AdminLayout - separate sidebar) */}
        {/* ============================================ */}
        <Route path="/admin" element={
          isAdmin ? (
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          ) : (
            <Navigate to="/dashboard" />
          )
        } />
        
        <Route path="/admin/posts" element={
          isAdmin ? (
            <AdminLayout>
              <AdminPosts />
            </AdminLayout>
          ) : (
            <Navigate to="/dashboard" />
          )
        } />
        
        <Route path="/admin/reports" element={
          isAdmin ? (
            <AdminLayout>
              <AdminReports />
            </AdminLayout>
          ) : (
            <Navigate to="/dashboard" />
          )
        } />
        
        <Route path="/admin/users" element={
          isAdmin ? (
            <AdminLayout>
              <AdminUsers />
            </AdminLayout>
          ) : (
            <Navigate to="/dashboard" />
          )
        } />
        
        <Route path="/admin/settings" element={
          isAdmin ? (
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          ) : (
            <Navigate to="/dashboard" />
          )
        } />
        
        {/* ============================================ */}
        {/* REGULAR USER ROUTES (AppLayout with Navbar)  */}
        {/* ============================================ */}
        <Route path="/dashboard" element={
          isAdmin ? (
            <Navigate to="/admin" />
          ) : (
            <AppLayout>
              <Dashboard />
            </AppLayout>
          )
        } />
        
        <Route path="/profile" element={
          isAdmin ? (
            <Navigate to="/admin" />
          ) : (
            <AppLayout>
              <Profile />
            </AppLayout>
          )
        } />
        
        <Route path="/assessment" element={
          isAdmin ? (
            <Navigate to="/admin" />
          ) : (
            <AppLayout>
              <Assessment />
            </AppLayout>
          )
        } />
        
        <Route path="/community" element={
          isAdmin ? (
            <Navigate to="/admin" />
          ) : (
            <AppLayout>
              <Community />
            </AppLayout>
          )
        } />
        
        <Route path="/history" element={
          isAdmin ? (
            <Navigate to="/admin" />
          ) : (
            <AppLayout>
              <History />
            </AppLayout>
          )
        } />
        
        {/* ============================================ */}
        {/* FALLBACK ROUTE                                */}
        {/* ============================================ */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
