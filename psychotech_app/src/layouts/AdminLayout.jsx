import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { auth } from '../firebase'
import { logoutUser } from '../services/firebaseService'
import './AdminLayout.css'

function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const isActive = (path) => {
    return location.pathname === path ? 'active' : ''
  }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="admin-sidebar-header">
          <h2>🛡️ PsychoTech</h2>
          <span className="admin-badge">Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/admin" className={`admin-nav-link ${isActive('/admin')}`}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          
          <Link to="/admin/posts" className={`admin-nav-link ${isActive('/admin/posts')}`}>
            <span className="nav-icon">📝</span>
            <span className="nav-text">Posts</span>
          </Link>
          
          <Link to="/admin/reports" className={`admin-nav-link ${isActive('/admin/reports')}`}>
            <span className="nav-icon">🚩</span>
            <span className="nav-text">Reports</span>
          </Link>
          
          <Link to="/admin/users" className={`admin-nav-link ${isActive('/admin/users')}`}>
            <span className="nav-icon">👥</span>
            <span className="nav-text">Users</span>
          </Link>
          
          <Link to="/admin/settings" className={`admin-nav-link ${isActive('/admin/settings')}`}>
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Settings</span>
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout-btn">
            🚪 Logout
          </button>
        </div>
      </aside>

      <button 
        className={`admin-sidebar-toggle ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        ☰
      </button>

      {isMobile && isSidebarOpen && (
        <div className="admin-overlay" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <main className={`admin-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="admin-content-header">
          <h1>Admin Panel</h1>
          <div className="admin-user-info">
            <span className="admin-email">{auth.currentUser?.email}</span>
          </div>
        </div>
        <div className="admin-content-body">
          {children}
        </div>
      </main>
    </div>
  )
}

export default AdminLayout