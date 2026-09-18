import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import './AdminDashboard.css'

function AdminSettings() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser
      if (!user) {
        navigate('/login')
        return
      }
      const tokenResult = await user.getIdTokenResult(true)
      if (!tokenResult.claims.admin) {
        navigate('/dashboard')
        return
      }
      setLoading(false)
    }
    checkAdmin()
  }, [navigate])

  if (loading) return <div className="admin-loading">Loading...</div>

  return (
    <div className="admin-dashboard">
      <h2 style={{ marginBottom: '20px' }}>⚙️ Admin Settings</h2>
      
      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-icon">👑</div>
          <h3>Admin Info</h3>
          <p><strong>Email:</strong> {auth.currentUser?.email}</p>
          <p><strong>Status:</strong> <span style={{ color: '#2D6A4F' }}>✅ Verified Admin</span></p>
        </div>
        
        <div className="settings-card">
          <div className="settings-icon">📊</div>
          <h3>Database Stats</h3>
          <p>Manage your Firebase database directly from the Firebase Console.</p>
          <button 
            className="settings-btn"
            onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
          >
            Open Firebase Console
          </button>
        </div>
        
        <div className="settings-card">
          <div className="settings-icon">🔒</div>
          <h3>Security</h3>
          <p>Firestore security rules are active and protecting user data.</p>
          <p style={{ fontSize: '13px', color: '#2D6A4F' }}>✅ Rules: Active</p>
        </div>
        
        <div className="settings-card">
          <div className="settings-icon">📱</div>
          <h3>App Info</h3>
          <p><strong>App Name:</strong> PsychoTech</p>
          <p><strong>Version:</strong> 1.0.0</p>
          <p><strong>Environment:</strong> Development</p>
        </div>
      </div>
      
      <div className="settings-actions">
        <button 
          className="action-btn secondary"
          onClick={() => window.location.reload()}
        >
          🔄 Refresh App
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => window.open('https://github.com/', '_blank')}
        >
          📚 Documentation
        </button>
      </div>
    </div>
  )
}

export default AdminSettings