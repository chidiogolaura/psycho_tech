import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  orderBy, 
  query, 
  where,
  limit,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  arrayUnion,
  getDoc
} from 'firebase/firestore'
import './Community.css'

function Community() {
  const [posts, setPosts] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all')
  const [userRiskLevel, setUserRiskLevel] = useState(null)
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [expandedPost, setExpandedPost] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportTarget, setReportTarget] = useState(null)
  const [reportReason, setReportReason] = useState('')
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  
  const navigate = useNavigate()

  // Blocked keywords for monitoring
  const blockedKeywords = [
    'kill myself', 'suicide', 'self harm', 'end my life',
    'kill them', 'hurt them', 'violent', 'cutting', 
    'overdose', 'bleeding', 'die', 'death wish'
  ]

  // Check if user is logged in
  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      navigate('/login')
      return
    }
    
    fetchUserData(currentUser.uid)
    fetchPosts()
  }, [navigate])

  // Fetch user's display name and risk level
  const fetchUserData = async (userId) => {
    try {
      // Get user profile
      const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
      const profileDoc = await getDoc(profileDocRef)
      
      if (profileDoc.exists()) {
        const userData = profileDoc.data()
        setUserName(userData.displayName || 'Anonymous')
      }
      
      // Get user's latest assessment for risk level
      const assessmentsRef = collection(db, 'users', userId, 'assessments')
      const q = query(assessmentsRef, orderBy('timestamp', 'desc'), limit(1))
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const latestAssessment = querySnapshot.docs[0].data()
        setUserRiskLevel(latestAssessment.risk_level || 'Not specified')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      setUserName('Anonymous')
    }
  }

  // Fetch all posts
  const fetchPosts = async () => {
    setLoading(true)
    try {
      let postsQuery
      
      if (selectedRiskFilter === 'all') {
        postsQuery = query(collection(db, 'posts'), orderBy('timestamp', 'desc'))
      } else {
        postsQuery = query(
          collection(db, 'posts'), 
          where('riskLevel', '==', selectedRiskFilter),
          orderBy('timestamp', 'desc')
        )
      }
      
      const querySnapshot = await getDocs(postsQuery)
      const postsList = []
      querySnapshot.forEach((doc) => {
        postsList.push({ id: doc.id, ...doc.data() })
      })
      
      setPosts(postsList)
      
      // Fetch comments for each post
      const commentsData = {}
      for (const post of postsList) {
        const commentsQuery = query(
          collection(db, 'comments'),
          where('postId', '==', post.id),
          orderBy('timestamp', 'asc')
        )
        const commentsSnapshot = await getDocs(commentsQuery)
        const postComments = []
        commentsSnapshot.forEach((doc) => {
          postComments.push({ id: doc.id, ...doc.data() })
        })
        commentsData[post.id] = postComments
      }
      setComments(commentsData)
      
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to load community posts')
    } finally {
      setLoading(false)
    }
  }

  // Check content for blocked keywords
  const containsBlockedKeywords = (text) => {
    const lowerText = text.toLowerCase()
    return blockedKeywords.some(keyword => lowerText.includes(keyword))
  }

  // Create new post
  const handleCreatePost = async () => {
    setError('')
    
    // Check for blocked keywords
    if (containsBlockedKeywords(newPostTitle) || containsBlockedKeywords(newPostContent)) {
      setShowCrisisAlert(true)
      setError('Your post contains sensitive content. Please reach out to crisis resources.')
      return
    }
    
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setError('Please enter both title and content')
      return
    }
    
    try {
      const currentUser = auth.currentUser
      const postData = {
        userId: currentUser.uid,
        authorName: userName,
        title: newPostTitle.trim(),
        content: newPostContent.trim(),
        riskLevel: userRiskLevel || 'Not specified',
        timestamp: serverTimestamp(),
        likes: 0,
        commentCount: 0,
        isFlagged: false
      }
      
      await addDoc(collection(db, 'posts'), postData)
      setSuccess('Post created successfully!')
      setNewPostTitle('')
      setNewPostContent('')
      setShowCreateModal(false)
      fetchPosts()
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error creating post:', error)
      setError('Failed to create post')
    }
  }

  // Add comment
  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return
    
    // Check for blocked keywords
    if (containsBlockedKeywords(newComment)) {
      setShowCrisisAlert(true)
      setError('Your comment contains sensitive content.')
      return
    }
    
    try {
      const currentUser = auth.currentUser
      const commentData = {
        postId: postId,
        userId: currentUser.uid,
        authorName: userName,
        content: newComment.trim(),
        timestamp: serverTimestamp(),
        isFlagged: false
      }
      
      await addDoc(collection(db, 'comments'), commentData)
      
      // Update post comment count
      const postRef = doc(db, 'posts', postId)
      await updateDoc(postRef, {
        commentCount: (comments[postId]?.length || 0) + 1
      })
      
      setNewComment('')
      fetchPosts() // Refresh to show new comment
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add comment')
    }
  }

  // Report content
  const handleReport = async () => {
    if (!reportReason) {
      setError('Please select a reason')
      return
    }
    
    try {
      const currentUser = auth.currentUser
      const reportData = {
        targetId: reportTarget.id,
        targetType: reportTarget.type,
        targetContent: reportTarget.content,
        reason: reportReason,
        reportedBy: currentUser.uid,
        reportedByName: userName,
        timestamp: serverTimestamp(),
        status: 'pending'
      }
      
      await addDoc(collection(db, 'reports'), reportData)
      setSuccess('Report submitted. Thank you for helping keep our community safe.')
      setShowReportModal(false)
      setReportReason('')
      setReportTarget(null)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error submitting report:', error)
      setError('Failed to submit report')
    }
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now'
    try {
      const date = timestamp.toDate()
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } catch (error) {
      return 'Recently'
    }
  }

  // Get risk badge class
  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return 'moderate'
    if (riskLevel.toLowerCase().includes('low')) return 'low'
    if (riskLevel.toLowerCase().includes('high')) return 'high'
    return 'moderate'
  }

  if (loading) {
    return (
      <div className="community-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading community posts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="community-container">
      {/* Header */}
      <div className="community-header">
        <h1>Community Support</h1>
        <p>Connect anonymously with peers who understand. Share, support, and grow together.</p>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
          ✏️ Create New Post
        </button>
        
        <div className="filter-bar">
          <span className="filter-label">Filter by risk level:</span>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${selectedRiskFilter === 'all' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('all'); fetchPosts(); }}
            >
              All
            </button>
            <button 
              className={`filter-btn ${selectedRiskFilter === 'Low Risk' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('Low Risk'); fetchPosts(); }}
            >
              Low Risk
            </button>
            <button 
              className={`filter-btn ${selectedRiskFilter === 'Moderate Risk' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('Moderate Risk'); fetchPosts(); }}
            >
              Moderate Risk
            </button>
            <button 
              className={`filter-btn ${selectedRiskFilter === 'High Risk' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('High Risk'); fetchPosts(); }}
            >
              High Risk
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="error-message" style={{ marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{ marginBottom: '20px' }}>
          ✅ {success}
        </div>
      )}

      {/* Crisis Alert */}
      {showCrisisAlert && (
        <div className="crisis-alert">
          <h4>⚠️ We're here to help</h4>
          <p>If you're experiencing thoughts of self-harm or suicide, please reach out:</p>
          <p><strong>Nigeria Suicide Prevention:</strong> 0800 000 3333</p>
          <p><strong>Mentally Aware Nigeria:</strong> 0809 111 1111</p>
          <button onClick={() => setShowCrisisAlert(false)} className="btn-cancel" style={{ marginTop: '12px' }}>
            Close
          </button>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <h3>No posts yet</h3>
          <p>Be the first to share your thoughts and support others.</p>
          <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
            Create First Post
          </button>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="post-card">
            {/* Post Header */}
            <div className="post-header">
              <div className="post-author">
                <span className="author-name">{post.authorName || 'Anonymous'}</span>
                <span className={`risk-badge ${getRiskClass(post.riskLevel)}`}>
                  {post.riskLevel || 'Not specified'}
                </span>
              </div>
              <span className="post-time">{formatTime(post.timestamp)}</span>
            </div>
            
            {/* Post Content */}
            <h3 className="post-title">{post.title}</h3>
            <p className="post-content">{post.content}</p>
            
            {/* Post Actions */}
            <div className="post-actions">
              <button 
                className="action-btn" 
                onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
              >
                💬 {post.commentCount || comments[post.id]?.length || 0} comments
              </button>
              <button 
                className="action-btn report"
                onClick={() => {
                  setReportTarget({
                    id: post.id,
                    type: 'post',
                    content: post.title + ' - ' + post.content
                  })
                  setShowReportModal(true)
                }}
              >
                🚩 Report
              </button>
            </div>
            
            {/* Comments Section */}
            {expandedPost === post.id && (
              <div className="comments-section">
                <div className="comments-list">
                  {comments[post.id]?.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header">
                        <span className="comment-author">{comment.authorName || 'Anonymous'}</span>
                        <span className="comment-time">{formatTime(comment.timestamp)}</span>
                      </div>
                      <p className="comment-content">{comment.content}</p>
                      <div className="comment-actions">
                        <button 
                          className="comment-report"
                          onClick={() => {
                            setReportTarget({
                              id: comment.id,
                              type: 'comment',
                              content: comment.content
                            })
                            setShowReportModal(true)
                          }}
                        >
                          Report
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!comments[post.id] || comments[post.id].length === 0) && (
                    <p style={{ color: 'var(--text-gray)', fontSize: '13px', padding: '12px 0' }}>
                      No comments yet. Be the first to respond.
                    </p>
                  )}
                </div>
                
                {/* Add Comment Form */}
                <div className="comment-form">
                  <textarea
                    className="comment-input"
                    placeholder="Write a supportive comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows="2"
                  />
                  <button 
                    className="comment-submit"
                    onClick={() => handleAddComment(post.id)}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Post</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Content</label>
                <textarea
                  placeholder="Share your thoughts or experiences..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-gray)', marginBottom: '16px' }}>
                ⚠️ Posts containing harmful content will be blocked.
              </p>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn-submit" onClick={handleCreatePost}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Report Content</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--text-gray)' }}>
                Why are you reporting this content?
              </p>
              <div className="report-options">
                {[
                  'Harassment or bullying',
                  'Inappropriate or offensive content',
                  'Spam or misleading',
                  'Self-harm or suicide mentions',
                  'Other'
                ].map((reason) => (
                  <label key={reason} className={`report-option ${reportReason === reason ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowReportModal(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleReport}>
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Community