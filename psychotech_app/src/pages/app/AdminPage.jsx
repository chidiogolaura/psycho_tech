import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import './AdminPage.css'

// YOUR EXACT EMAIL
const ADMIN_EMAIL = 'umeozuluchidiogo@gmail.com' // ← CHANGED TO YOUR EMAIL

function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    // Check if user is admin
    if (currentUser.email !== ADMIN_EMAIL) {
      setError('Access denied. Admin only.')
      setTimeout(() => navigate('/dashboard'), 2000)
      return
    }
    
    setLoading(false)
  }, [navigate])

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-container">
        <div className="error-message">⚠️ {error}</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Welcome Admin! You are logged in as: <strong>{auth.currentUser?.email}</strong></p>
      </div>
      
      <div style={{ 
        background: 'white', 
        padding: '24px', 
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <h2>✅ Admin Page is Working!</h2>
        <p>Your reports will appear here soon.</p>
        <p style={{ color: 'var(--text-gray)', fontSize: '14px', marginTop: '12px' }}>
          Reports from the Community page will show up here for moderation.
        </p>
      </div>
    </div>
  )
}

export default AdminPage