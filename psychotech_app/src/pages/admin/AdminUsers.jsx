import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  where
} from 'firebase/firestore'
import './AdminDashboard.css'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
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
      fetchUsers()
    }
    checkAdmin()
  }, [navigate])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // Get all posts to extract unique user IDs
      const postsSnapshot = await getDocs(collection(db, 'posts'))
      const userMap = {}
      
      postsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.userId) {
          if (!userMap[data.userId]) {
            userMap[data.userId] = {
              userId: data.userId,
              displayName: data.authorName || 'Anonymous',
              riskLevel: data.riskLevel || 'Unknown',
              postCount: 0,
              commentCount: 0,
              lastActive: data.timestamp
            }
          }
          userMap[data.userId].postCount += 1
        }
      })

      // Get comments to add to user data
      const commentsSnapshot = await getDocs(collection(db, 'comments'))
      commentsSnapshot.docs.forEach(doc => {
        const data = doc.data()
        if (data.userId && userMap[data.userId]) {
          userMap[data.userId].commentCount += 1
        }
      })

      const userList = Object.values(userMap)
      setUsers(userList)
    } catch (error) {
      console.error('Error fetching users:', error)
      showMessage('❌ Failed to load users', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const deleteUserContent = async (userId) => {
    if (!window.confirm(`⚠️ Delete ALL posts and comments by this user? This cannot be undone!`)) return
    
    try {
      // Delete all posts by this user
      const postsQuery = query(collection(db, 'posts'), where('userId', '==', userId))
      const postsSnapshot = await getDocs(postsQuery)
      const batch = []
      postsSnapshot.forEach((doc) => {
        batch.push(deleteDoc(doc.ref))
      })
      await Promise.all(batch)
      
      // Delete all comments by this user
      const commentsQuery = query(collection(db, 'comments'), where('userId', '==', userId))
      const commentsSnapshot = await getDocs(commentsQuery)
      commentsSnapshot.forEach((doc) => {
        batch.push(deleteDoc(doc.ref))
      })
      await Promise.all(batch)
      
      showMessage(`✅ All content by ${userId} deleted successfully`)
      setUsers(users.filter(u => u.userId !== userId))
    } catch (error) {
      console.error('Error deleting user content:', error)
      showMessage('❌ Failed to delete user content', 'error')
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return 'moderate'
    if (riskLevel.toLowerCase().includes('low')) return 'low'
    if (riskLevel.toLowerCase().includes('high')) return 'high'
    return 'moderate'
  }

  if (loading) return <div className="admin-loading">Loading users...</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>👥 Users</h2>
        <span className="admin-count">{users.length} active users</span>
      </div>

      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
        </div>
      )}

      {users.length === 0 ? (
        <div className="empty-state-admin">
          <div className="empty-icon">👥</div>
          <h3>No Users Yet</h3>
          <p>There are no active users in the community.</p>
        </div>
      ) : (
        <div className="admin-list">
          {users.map((user) => (
            <div key={user.userId} className="admin-item-card user-card">
              <div className="admin-item-header">
                <div className="admin-item-meta">
                  <span className="admin-item-author">
                    👤 {user.displayName || 'Anonymous'}
                  </span>
                  <span className={`risk-badge ${getRiskClass(user.riskLevel)}`}>
                    {user.riskLevel || 'Unknown'}
                  </span>
                  <span className="admin-item-time">
                    🕐 Last Active: {formatTime(user.lastActive)}
                  </span>
                </div>
                <div className="admin-item-actions">
                  <button 
                    className="btn-delete"
                    onClick={() => deleteUserContent(user.userId)}
                  >
                    🗑️ Delete Content
                  </button>
                </div>
              </div>
              <div className="admin-item-body">
                <div className="user-stats">
                  <span className="user-stat">
                    📝 {user.postCount} posts
                  </span>
                  <span className="user-stat">
                    💬 {user.commentCount || 0} comments
                  </span>
                  <span className="user-stat user-id">
                    🆔 {user.userId.substring(0, 12)}...
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminUsers