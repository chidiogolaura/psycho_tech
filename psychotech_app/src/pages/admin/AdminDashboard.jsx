import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import './AdminDashboard.css'

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    pendingReports: 0,
    highRiskUsers: 0
  })
  const [recentPosts, setRecentPosts] = useState([])
  const [loading, setLoading] = useState(true)
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
      fetchData()
    }
    checkAdmin()
  }, [navigate])

  const fetchData = async () => {
    try {
      // Fetch posts
      const postsSnapshot = await getDocs(collection(db, 'posts'))
      const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setStats(prev => ({ ...prev, totalPosts: posts.length }))

      // Fetch comments
      const commentsSnapshot = await getDocs(collection(db, 'comments'))
      setStats(prev => ({ ...prev, totalComments: commentsSnapshot.size }))

      // Fetch pending reports
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'))
      const reportsSnapshot = await getDocs(reportsQuery)
      setStats(prev => ({ ...prev, pendingReports: reportsSnapshot.size }))

      // Fetch recent posts (latest 5)
      const recentQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(5))
      const recentSnapshot = await getDocs(recentQuery)
      const recentList = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setRecentPosts(recentList)

      // Count high risk users (from posts with High Risk)
      const highRiskQuery = query(collection(db, 'posts'), where('riskLevel', '==', 'High Risk'))
      const highRiskSnapshot = await getDocs(highRiskQuery)
      const highRiskUsers = new Set()
      highRiskSnapshot.docs.forEach(doc => {
        if (doc.data().userId) highRiskUsers.add(doc.data().userId)
      })
      setStats(prev => ({ ...prev, highRiskUsers: highRiskUsers.size }))

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <h3>{stats.totalPosts}</h3>
            <p>Total Posts</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <h3>{stats.totalComments}</h3>
            <p>Total Comments</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚩</div>
          <div className="stat-info">
            <h3>{stats.pendingReports}</h3>
            <p>Pending Reports</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <h3>{stats.highRiskUsers}</h3>
            <p>High Risk Users</p>
          </div>
        </div>
      </div>

      <div className="admin-recent-section">
        <h2>Recent Posts</h2>
        {recentPosts.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)' }}>No posts yet</p>
        ) : (
          <div className="admin-list">
            {recentPosts.map(post => (
              <div key={post.id} className="admin-item-card">
                <div className="admin-item-header">
                  <div className="admin-item-meta">
                    <span className="admin-item-author">{post.authorName || 'Anonymous'}</span>
                    <span className={`risk-badge ${post.riskLevel?.toLowerCase() || 'moderate'}`}>
                      {post.riskLevel || 'Unknown'}
                    </span>
                    <span className="admin-item-time">
                      {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="admin-item-body">
                  <div className="admin-item-title">{post.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-quick-actions">
        <h2>Quick Actions</h2>
        <div className="quick-action-grid">
          <button onClick={() => window.location.href = '/admin/reports'} className="action-btn primary">
            🚩 Review Reports ({stats.pendingReports})
          </button>
          <button onClick={() => window.location.href = '/admin/posts'} className="action-btn secondary">
            📝 Manage Posts
          </button>
          <button onClick={() => window.location.href = '/admin/users'} className="action-btn secondary">
            👥 Manage Users
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard