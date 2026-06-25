import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { auth } from '../firebase'
import { logoutUser } from '../services/firebaseService'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

  // DIRECT CHECK - NO useEffect
  const user = auth.currentUser
  const isAdmin = user && user.email === 'umeozuluchidiogo@gmail.com'

  console.log('=== NAVBAR TEST ===')
  console.log('Current user:', user)
  console.log('User email:', user?.email)
  console.log('Is Admin?', isAdmin)

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <>
      <button 
        className={`hamburger ${isMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>PsychoTech</h2>
          <span className="sidebar-tagline">Mental Health Companion</span>
          {/* VISIBLE TEST BADGE */}
          <div style={{
            marginTop: '12px',
            padding: '8px 16px',
            background: isAdmin ? '#2D6A4F' : '#C0392B',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            {isAdmin ? '✅ ADMIN MODE' : '❌ USER MODE'}
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink to="/community" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <span className="nav-icon">💬</span>
            <span className="nav-text">Community</span>
          </NavLink>
          
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <span className="nav-icon">📋</span>
            <span className="nav-text">History</span>
          </NavLink>
          
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profile</span>
          </NavLink>

          {/* Admin Link - Always shows for testing */}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
              <span className="nav-icon">🛡️</span>
              <span className="nav-text">Admin</span>
            </NavLink>
          )}
        </nav>
      </aside>

      {isMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </>
  )
}

export default Navbar