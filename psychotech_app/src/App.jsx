import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import Dashboard from './pages/app/Dashboard'
import Profile from './pages/app/Profile'
import Assessment from './pages/app/Assessment'
import Community from './pages/app/Community'
import AdminPage from './pages/app/AdminPage'  // ← ADD THIS IMPORT
import Navbar from './components/Navbar'

// Layout component that includes Navbar for protected pages
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
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no navbar) */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes (with navbar) */}
        <Route path="/dashboard" element={
          <AppLayout>
            <Dashboard />
          </AppLayout>
        } />
        
        <Route path="/profile" element={
          <AppLayout>
            <Profile />
          </AppLayout>
        } />
        
        <Route path="/assessment" element={
          <AppLayout>
            <Assessment />
          </AppLayout>
        } />
        
        <Route path="/community" element={
          <AppLayout>
            <Community />
          </AppLayout>
        } />
        
        {/* ← ADD THIS ADMIN ROUTE */}
        <Route path="/admin" element={
          <AppLayout>
            <AdminPage />
          </AppLayout>
        } />
        
        <Route path="/history" element={
          <AppLayout>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h2>History Page</h2>
              <p>Your assessment history will appear here soon!</p>
            </div>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App