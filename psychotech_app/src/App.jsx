import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/auth/login'
import Signup from './pages/auth/signup'
import Dashboard from './pages/app/Dashboard'
import Profile from './pages/app/Profile'
import Assessment from './pages/app/Assessment'
import Navbar from './components/Navbar'

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
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Protected routes */}
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
            <div style={{ padding: '40px', textAlign: 'center' }}>Community Page - Coming Soon</div>
          </AppLayout>
        } />
        <Route path="/history" element={
          <AppLayout>
            <div style={{ padding: '40px', textAlign: 'center' }}>History Page - Coming Soon</div>
          </AppLayout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App