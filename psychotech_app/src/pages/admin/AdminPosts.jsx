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
  writeBatch
} from 'firebase/firestore'
import './AdminDashboard.css'

function AdminPosts() {
  const [posts, setPosts] = useState([])
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
      fetchPosts()
    }
    checkAdmin()
  }, [navigate])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))
      const snapshot = await getDocs(postsQuery)
      const postsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      setPosts(postsList)
    } catch (error) {
      console.error('Error fetching posts:', error)
      showMessage('❌ Failed to load posts', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const deletePost = async (postId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this post? This action cannot be undone.')) return
    
    try {
      // Delete the post
      await deleteDoc(doc(db, 'posts', postId))
      
      // Delete all comments on this post using batch
      const commentsQuery = query(collection(db, 'comments'))
      const commentsSnapshot = await getDocs(commentsQuery)
      const batch = writeBatch(db)
      
      commentsSnapshot.forEach((doc) => {
        if (doc.data().postId === postId) {
          batch.delete(doc.ref)
        }
      })
      await batch.commit()
      
      showMessage('✅ Post and all comments deleted successfully')
      setPosts(posts.filter(p => p.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
      showMessage('❌ Failed to delete post. Error: ' + error.message, 'error')
    }
  }

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

  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return 'moderate'
    if (riskLevel.toLowerCase().includes('low')) return 'low'
    if (riskLevel.toLowerCase().includes('high')) return 'high'
    return 'moderate'
  }

  if (loading) return <div className="admin-loading">Loading posts...</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>📝 All Posts</h2>
        <span className="admin-count">{posts.length} posts</span>
      </div>

      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty-state-admin">
          <div className="empty-icon">📭</div>
          <h3>No Posts Yet</h3>
          <p>There are no posts in the community.</p>
        </div>
      ) : (
        <div className="admin-list">
          {posts.map((post) => (
            <div key={post.id} className="admin-item-card">
              <div className="admin-item-header">
                <div className="admin-item-meta">
                  <span className="admin-item-author">
                    👤 {post.authorName || 'Anonymous'}
                  </span>
                  <span className={`risk-badge ${getRiskClass(post.riskLevel)}`}>
                    {post.riskLevel || 'Unknown'}
                  </span>
                  <span className="admin-item-time">
                    🕐 {formatTime(post.timestamp)}
                  </span>
                </div>
                <div className="admin-item-actions">
                  <button 
                    className="btn-delete"
                    onClick={() => deletePost(post.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
              <div className="admin-item-body">
                <h4 className="admin-item-title">{post.title || 'Untitled'}</h4>
                <p className="admin-item-content">{post.content || 'No content'}</p>
                {post.commentCount !== undefined && (
                  <span className="admin-item-comments">💬 {post.commentCount} comments</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPosts