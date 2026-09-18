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
  getDoc,
  increment
} from 'firebase/firestore'
import './Community.css'

function Community() {
  const [posts, setPosts] = useState([])
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
  const [commentingPostId, setCommentingPostId] = useState(null)
  
  const navigate = useNavigate()

  const blockedKeywords = [
    'kill myself', 'suicide', 'self harm', 'end my life',
    'kill them', 'hurt them', 'violent', 'cutting', 
    'overdose', 'bleeding', 'die', 'death wish'
  ]

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchUserData(currentUser.uid)
    fetchPosts()
  }, [navigate])

  const fetchUserData = async (userId) => {
    try {
      const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
      const profileDoc = await getDoc(profileDocRef)
      
      if (profileDoc.exists()) {
        const userData = profileDoc.data()
        setUserName(userData.displayName || 'Anonymous')
      }
      
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
      
      // Load comments for expanded posts
      for (const post of postsList) {
        if (expandedPost === post.id) {
          const comments = await fetchComments(post.id)
          post.comments = comments
          post.commentsLoaded = true
        }
      }
      
      setPosts(postsList)
    } catch (error) {
      console.error('Error fetching posts:', error)
      setError('Failed to load community posts')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId) => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('postId', '==', postId),
        orderBy('timestamp', 'asc')
      )
      const commentsSnapshot = await getDocs(commentsQuery)
      const postComments = []
      commentsSnapshot.forEach((doc) => {
        postComments.push({ id: doc.id, ...doc.data() })
      })
      return postComments
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }

  const loadCommentsForPost = async (postId) => {
    const comments = await fetchComments(postId)
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === postId 
          ? { ...post, comments: comments, commentsLoaded: true }
          : post
      )
    )
  }

  const togglePostComments = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null)
    } else {
      setExpandedPost(postId)
      const post = posts.find(p => p.id === postId)
      if (!post?.commentsLoaded) {
        loadCommentsForPost(postId)
      }
    }
  }

  const containsBlockedKeywords = (text) => {
    const lowerText = text.toLowerCase()
    return blockedKeywords.some(keyword => lowerText.includes(keyword))
  }

  const handleCreatePost = async () => {
    setError('')
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
      if (!currentUser) {
        setError('You must be logged in to post')
        return
      }
      const postData = {
        userId: currentUser.uid,
        authorName: userName || 'Anonymous',
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
      setError('Failed to create post: ' + error.message)
    }
  }

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) {
      setError('Please enter a comment')
      return
    }
    if (containsBlockedKeywords(newComment)) {
      setShowCrisisAlert(true)
      setError('Your comment contains sensitive content.')
      return
    }
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('You must be logged in to comment')
        return
      }
      
      const commentData = {
        postId: postId,
        userId: currentUser.uid,
        authorName: userName || 'Anonymous',
        content: newComment.trim(),
        timestamp: serverTimestamp(),
        isFlagged: false
      }
      
      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), commentData)
      
      // Get the current post to update comment count
      const postRef = doc(db, 'posts', postId)
      const postDoc = await getDoc(postRef)
      const currentCount = postDoc.exists() ? postDoc.data().commentCount || 0 : 0
      
      // Update post comment count
      await updateDoc(postRef, {
        commentCount: currentCount + 1
      })
      
      setNewComment('')
      setCommentingPostId(null)
      
      // Reload comments for this post
      await loadCommentsForPost(postId)
      
      // Refresh the post list to update comment counts
      await fetchPosts()
      
      setSuccess('Comment added successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add comment: ' + error.message)
    }
  }

  const handleLikePost = async (postId) => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('You must be logged in to like')
        return
      }
      
      const postRef = doc(db, 'posts', postId)
      const post = posts.find(p => p.id === postId)
      
      // Check if user already liked this post
      const userLikesRef = collection(db, 'users', currentUser.uid, 'likes')
      const q = query(userLikesRef, where('postId', '==', postId))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        // Add like
        await addDoc(userLikesRef, {
          postId: postId,
          timestamp: serverTimestamp()
        })
        await updateDoc(postRef, {
          likes: increment(1)
        })
        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p
          )
        )
      } else {
        // Remove like
        const likeDoc = snapshot.docs[0]
        await deleteDoc(doc(db, 'users', currentUser.uid, 'likes', likeDoc.id))
        await updateDoc(postRef, {
          likes: increment(-1)
        })
        // Update local state
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId ? { ...p, likes: Math.max((p.likes || 0) - 1, 0) } : p
          )
        )
      }
    } catch (error) {
      console.error('Error toggling like:', error)
      setError('Failed to like post')
    }
  }

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('You must be logged in')
        return
      }
      
      // Delete the comment
      await deleteDoc(doc(db, 'comments', commentId))
      
      // Update post comment count
      const postRef = doc(db, 'posts', postId)
      const postDoc = await getDoc(postRef)
      const currentCount = postDoc.exists() ? postDoc.data().commentCount || 0 : 0
      await updateDoc(postRef, {
        commentCount: Math.max(currentCount - 1, 0)
      })
      
      // Reload comments
      await loadCommentsForPost(postId)
      await fetchPosts()
      
      setSuccess('Comment deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error) {
      console.error('Error deleting comment:', error)
      setError('Failed to delete comment')
    }
  }

  const handleReport = async () => {
    if (!reportReason) {
      setError('Please select a reason')
      return
    }
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError('You must be logged in to report')
        return
      }
      
      const reportData = {
        targetId: reportTarget.id,
        targetType: reportTarget.type,
        targetContent: reportTarget.content,
        reason: reportReason,
        reportedBy: currentUser.uid,
        reportedByName: userName || 'Anonymous',
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
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      return `${diffDays}d ago`
    } catch (error) {
      return 'Recently'
    }
  }

  const getRiskClass = (riskLevel) => {
    if (!riskLevel) return 'moderate'
    if (riskLevel.toLowerCase().includes('low')) return 'low'
    if (riskLevel.toLowerCase().includes('high')) return 'high'
    return 'moderate'
  }

  // Check if current user is the author of a post or comment
  const isAuthor = (userId) => {
    const currentUser = auth.currentUser
    return currentUser && currentUser.uid === userId
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
        <div>
          <h1>💬 Community Support</h1>
          <p>Connect anonymously with peers who understand. Share, support, and grow together.</p>
        </div>
        <button className="create-post-btn" onClick={() => setShowCreateModal(true)}>
          ✏️ New Post
        </button>
      </div>

      {/* Action Bar */}
      <div className="action-bar">
        <div className="filter-bar">
          <span className="filter-label">Filter by risk:</span>
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
              🟢 Low
            </button>
            <button 
              className={`filter-btn ${selectedRiskFilter === 'Moderate Risk' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('Moderate Risk'); fetchPosts(); }}
            >
              🟡 Moderate
            </button>
            <button 
              className={`filter-btn ${selectedRiskFilter === 'High Risk' ? 'active' : ''}`}
              onClick={() => { setSelectedRiskFilter('High Risk'); fetchPosts(); }}
            >
              🔴 High
            </button>
          </div>
        </div>
        <span className="post-count">{posts.length} posts</span>
      </div>

      {/* Messages */}
      {error && <div className="error-message">⚠️ {error}</div>}
      {success && <div className="success-message">✅ {success}</div>}

      {/* Crisis Alert */}
      {showCrisisAlert && (
        <div className="crisis-alert">
          <h4>⚠️ We're here to help</h4>
          <p>If you're experiencing thoughts of self-harm or suicide, please reach out:</p>
          <p><strong>Nigeria Suicide Prevention:</strong> 0800 000 3333</p>
          <p><strong>Mentally Aware Nigeria:</strong> 0809 111 1111</p>
          <button onClick={() => setShowCrisisAlert(false)} className="btn-close-crisis">
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
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="post-author">
                  <span className="author-name">{post.authorName || 'Anonymous'}</span>
                  <span className={`risk-badge ${getRiskClass(post.riskLevel)}`}>
                    {post.riskLevel || 'Not specified'}
                  </span>
                  <span className="post-time">· {formatTime(post.timestamp)}</span>
                </div>
              </div>
              
              {/* Post Content */}
              <h3 className="post-title">{post.title}</h3>
              <p className="post-content">{post.content}</p>
              
              {/* Post Actions */}
              <div className="post-actions">
                <button 
                  className={`action-btn like-btn`}
                  onClick={() => handleLikePost(post.id)}
                >
                  ❤️ <span>{post.likes || 0}</span>
                </button>
                <button 
                  className="action-btn comment-btn"
                  onClick={() => togglePostComments(post.id)}
                >
                  💬 <span>{post.commentCount || 0}</span>
                </button>
                <button 
                  className="action-btn share-btn"
                  onClick={() => {
                    const shareText = `${post.title}\n\n${post.content}`;
                    if (navigator.share) {
                      navigator.share({ title: post.title, text: shareText })
                    } else {
                      navigator.clipboard.writeText(shareText)
                      setSuccess('Post copied to clipboard!')
                      setTimeout(() => setSuccess(''), 3000)
                    }
                  }}
                >
                  🔗 Share
                </button>
                <button 
                  className="action-btn report-btn"
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
                    {post.comments && post.comments.length > 0 ? (
                      post.comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-header">
                            <span className="comment-author">{comment.authorName || 'Anonymous'}</span>
                            <span className="comment-time">· {formatTime(comment.timestamp)}</span>
                            {isAuthor(comment.userId) && (
                              <button 
                                className="comment-delete"
                                onClick={() => handleDeleteComment(post.id, comment.id)}
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                          <p className="comment-content">{comment.content}</p>
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
                      ))
                    ) : (
                      <p className="no-comments">No comments yet. Be the first to respond.</p>
                    )}
                  </div>
                  
                  {/* Add Comment Form */}
                  <div className="comment-form">
                    <textarea
                      className="comment-input"
                      placeholder="Write a supportive comment..."
                      value={commentingPostId === post.id ? newComment : ''}
                      onChange={(e) => {
                        setCommentingPostId(post.id)
                        setNewComment(e.target.value)
                      }}
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
          ))}
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Create New Post</h2>
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
              <p className="modal-hint">⚠️ Posts containing harmful content will be blocked.</p>
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
              <h2>🚩 Report Content</h2>
              <button className="modal-close" onClick={() => setShowReportModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="report-hint">Why are you reporting this content?</p>
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
                <button className="btn-submit danger" onClick={handleReport}>
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