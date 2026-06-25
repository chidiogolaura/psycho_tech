import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { logoutUser } from '../services/firebaseService'
import './Navbar.css'

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navigate = useNavigate()

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
      {/* Hamburger Button - Visible on Mobile */}
      <button 
        className={`hamburger ${isMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>PsychoTech</h2>
          <span className="sidebar-tagline">Mental Health Companion</span>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2h-5v-7H9v7H4a2 2 0 0 1-2-2z" />
            </svg>
            <span className="nav-text">Dashboard</span>
          </NavLink>
          
          <NavLink to="/community" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span className="nav-text">Community</span>
          </NavLink>
          
          <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="nav-text">History</span>
          </NavLink>
          
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="nav-text">Profile</span>
          </NavLink>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMenuOpen && <div className="sidebar-overlay" onClick={() => setIsMenuOpen(false)}></div>}
    </>
  )
}

export default Navbar