import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  orderBy,
  getDoc,
  limit,
  startAfter
} from 'firebase/firestore'
import './AdminPage.css'

function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Data states
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    pendingReports: 0
  })
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const navigate = useNavigate()

  // Check admin access
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login')
        return
      }
      
      try {
        const tokenResult = await user.getIdTokenResult(true)
        const admin = tokenResult.claims.admin === true
        
        if (!admin) {
          navigate('/dashboard')
          return
        }
        
        setIsAdmin(true)
        fetchAllData()
      } catch (error) {
        console.error('Error verifying admin:', error)
        navigate('/dashboard')
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [navigate])

  // Fetch all data
  const fetchAllData = async () => {
    try {
      // Fetch stats
      const postsSnapshot = await getDocs(collection(db, 'posts'))
      const commentsSnapshot = await getDocs(collection(db, 'comments'))
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'))
      const reportsSnapshot = await getDocs(reportsQuery)
      
      setStats({
        totalUsers: 0, // We'll update this from Firebase Auth
        totalPosts: postsSnapshot.size,
        totalComments: commentsSnapshot.size,
        pendingReports: reportsSnapshot.size
      })
      
      // Fetch recent posts
      const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'), limit(20))
      const postsData = await getDocs(postsQuery)
      const postsList = []
      postsData.forEach((doc) => {
        postsList.push({ id: doc.id, ...doc.data() })
      })
      setPosts(postsList)
      
      // Fetch pending reports
      const reportsData = await getDocs(reportsQuery)
      const reportsList = []
      for (const docSnapshot of reportsData.docs) {
        const reportData = docSnapshot.data()
        // Fetch the actual content being reported
        let targetContent = reportData.targetContent || 'Content not available'
        
        if (!reportData.targetContent) {
          try {
            if (reportData.targetType === 'post') {
              const postRef = doc(db, 'posts', reportData.targetId)
              const postDoc = await getDoc(postRef)
              if (postDoc.exists()) {
                targetContent = postDoc.data().content || 'Content not available'
              }
            } else if (reportData.targetType === 'comment') {
              const commentRef = doc(db, 'comments', reportData.targetId)
              const commentDoc = await getDoc(commentRef)
              if (commentDoc.exists()) {
                targetContent = commentDoc.data().content || 'Content not available'
              }
            }
          } catch (error) {
            console.error('Error fetching target content:', error)
          }
        }
        
        reportsList.push({
          id: docSnapshot.id,
          ...reportData,
          targetContent: targetContent
        })
      }
      setReports(reportsList)
      
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load admin data')
    }
  }

  // Delete a post
  const handleDeletePost = async (postId, reportId = null) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return
    
    try {
      await deleteDoc(doc(db, 'posts', postId))
      
      // Update stats
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }))
      
      // Remove from posts list
      setPosts(posts.filter(p => p.id !== postId))
      
      // If a report was associated, mark it as reviewed
      if (reportId) {
        await updateDoc(doc(db, 'reports', reportId), {
          status: 'reviewed',
          actionTaken: 'deleted',
          reviewedAt: new Date().toISOString()
        })
      }
      
      setSuccess('Post deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
      fetchAllData()
    } catch (error) {
      console.error('Error deleting post:', error)
      setError('Failed to delete post')
    }
  }

  // Delete a comment
  const handleDeleteComment = async (commentId, reportId = null) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    
    try {
      await deleteDoc(doc(db, 'comments', commentId))
      
      setStats(prev => ({ ...prev, totalComments: prev.totalComments - 1 }))
      
      if (reportId) {
        await updateDoc(doc(db, 'reports', reportId), {
          status: 'reviewed',
          actionTaken: 'deleted',
          reviewedAt: new Date().toISOString()
        })
      }
      
      setSuccess('Comment deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
      fetchAllData()
    } catch (error) {
      console.error('Error deleting comment:', error)
      setError('Failed to delete comment')
    }
  }

  // Dismiss a report
  const handleDismissReport = async (reportId) => {
    if (!window.confirm('Dismiss this report?')) return
    
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'dismissed',
        actionTaken: 'dismissed',
        reviewedAt: new Date().toISOString()
      })
      
      setSuccess('Report dismissed')
      setTimeout(() => setSuccess(''), 3000)
      fetchAllData()
    } catch (error) {
      console.error('Error dismissing report:', error)
      setError('Failed to dismiss report')
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Unknown'
    }
  }

  // Get risk class
  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return 'moderate'
    if (riskLevel.toLowerCase().includes('low')) return 'low'
    if (riskLevel.toLowerCase().includes('high')) return 'high'
    return 'moderate'
  }

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

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>🛡️ Admin Panel</h1>
        <p>Welcome <strong>{auth.currentUser?.email}</strong></p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          🚩 Reports ({stats.pendingReports})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts ({stats.totalPosts})
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-grid">
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
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="admin-actions">
            <h3>Quick Actions</h3>
            <div className="action-grid">
              <button onClick={() => setActiveTab('reports')} className="action-btn-primary">
                Review Reports ({stats.pendingReports})
              </button>
              <button onClick={() => setActiveTab('posts')} className="action-btn-secondary">
                Manage Posts
              </button>
              <button onClick={fetchAllData} className="action-btn-secondary">
                🔄 Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-section">
          <h2>🚩 Pending Reports</h2>
          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎉</div>
              <h3>All Clear!</h3>
              <p>No pending reports to review.</p>
            </div>
          ) : (
            <div className="reports-list">
              {reports.map((report) => (
                <div key={report.id} className="report-card">
                  <div className="report-header">
                    <div className="report-meta">
                      <span className="report-type">
                        {report.targetType === 'post' ? '📢 Post' : '💬 Comment'}
                      </span>
                      <span className="report-author">
                        Reported by: {report.reportedByName || 'Anonymous'}
                      </span>
                      <span className="report-time">
                        {formatTime(report.timestamp)}
                      </span>
                    </div>
                    <span className="report-status pending">Pending</span>
                  </div>

                  <div className="report-body">
                    <div className="report-reason">
                      <strong>Reason:</strong> {report.reason || 'Not specified'}
                    </div>
                    <div className="report-content">
                      <strong>Reported Content:</strong>
                      <p className="content-text">{report.targetContent || 'Content not available'}</p>
                    </div>
                  </div>

                  <div className="report-actions">
                    <button 
                      className="btn btn-delete"
                      onClick={() => {
                        if (report.targetType === 'post') {
                          handleDeletePost(report.targetId, report.id)
                        } else {
                          handleDeleteComment(report.targetId, report.id)
                        }
                      }}
                    >
                      🗑️ Delete Content
                    </button>
                    <button 
                      className="btn btn-dismiss"
                      onClick={() => handleDismissReport(report.id)}
                    >
                      ✅ Dismiss Report
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="posts-section">
          <h2>📝 All Posts</h2>
          {posts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No Posts</h3>
              <p>There are no posts in the community yet.</p>
            </div>
          ) : (
            <div className="posts-list">
              {posts.map((post) => (
                <div key={post.id} className="post-card-admin">
                  <div className="post-header-admin">
                    <div className="post-meta-admin">
                      <span className="post-author-admin">{post.authorName || 'Anonymous'}</span>
                      <span className={`risk-badge ${getRiskClass(post.riskLevel)}`}>
                        {post.riskLevel || 'Not specified'}
                      </span>
                      <span className="post-time-admin">{formatTime(post.timestamp)}</span>
                    </div>
                  </div>
                  <h4 className="post-title-admin">{post.title}</h4>
                  <p className="post-content-admin">{post.content}</p>
                  <div className="post-actions-admin">
                    <button 
                      className="btn btn-delete"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      🗑️ Delete Post
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminPage