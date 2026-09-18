import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc
} from 'firebase/firestore'
import './AdminDashboard.css'

function AdminReports() {
  const [reports, setReports] = useState([])
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
      fetchReports()
    }
    checkAdmin()
  }, [navigate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const reportsQuery = query(
        collection(db, 'reports'), 
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(reportsQuery)
      
      const reportsList = []
      for (const docSnapshot of snapshot.docs) {
        const reportData = docSnapshot.data()
        let targetContent = reportData.targetContent || 'Content not available'
        let targetAuthor = 'Unknown'
        let targetTitle = ''
        
        // Fetch the actual content being reported
        try {
          if (reportData.targetType === 'post') {
            const postRef = doc(db, 'posts', reportData.targetId)
            const postDoc = await getDoc(postRef)
            if (postDoc.exists()) {
              const postData = postDoc.data()
              targetContent = postData.content || 'Content not available'
              targetAuthor = postData.authorName || 'Anonymous'
              targetTitle = postData.title || 'Untitled'
            } else {
              targetContent = '⚠️ Post already deleted'
            }
          } else if (reportData.targetType === 'comment') {
            const commentRef = doc(db, 'comments', reportData.targetId)
            const commentDoc = await getDoc(commentRef)
            if (commentDoc.exists()) {
              const commentData = commentDoc.data()
              targetContent = commentData.content || 'Content not available'
              targetAuthor = commentData.authorName || 'Anonymous'
            } else {
              targetContent = '⚠️ Comment already deleted'
            }
          }
        } catch (error) {
          console.error('Error fetching target content:', error)
        }
        
        reportsList.push({
          id: docSnapshot.id,
          ...reportData,
          targetContent: targetContent,
          targetAuthor: targetAuthor,
          targetTitle: targetTitle
        })
      }
      setReports(reportsList)
    } catch (error) {
      console.error('Error fetching reports:', error)
      showMessage('❌ Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 4000)
  }

  const deleteContent = async (report) => {
    const confirmMsg = report.targetType === 'post' 
      ? '⚠️ Delete this post and all its comments? This cannot be undone!' 
      : '⚠️ Delete this comment? This cannot be undone!'
    
    if (!window.confirm(confirmMsg)) return
    
    try {
      // Delete the reported content
      if (report.targetType === 'post') {
        await deleteDoc(doc(db, 'posts', report.targetId))
        
        // Also delete all comments on this post
        const commentsQuery = query(collection(db, 'comments'))
        const commentsSnapshot = await getDocs(commentsQuery)
        const batch = []
        commentsSnapshot.forEach((doc) => {
          if (doc.data().postId === report.targetId) {
            batch.push(deleteDoc(doc.ref))
          }
        })
        await Promise.all(batch)
      } else {
        await deleteDoc(doc(db, 'comments', report.targetId))
      }
      
      // Update report status
      await updateDoc(doc(db, 'reports', report.id), {
        status: 'reviewed',
        actionTaken: 'deleted',
        reviewedAt: new Date().toISOString()
      })
      
      showMessage(`✅ ${report.targetType === 'post' ? 'Post' : 'Comment'} deleted successfully`)
      setReports(reports.filter(r => r.id !== report.id))
    } catch (error) {
      console.error('Error deleting content:', error)
      showMessage('❌ Failed to delete content', 'error')
    }
  }

  const dismissReport = async (reportId) => {
    if (!window.confirm('Dismiss this report? (Content will remain visible)')) return
    
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'dismissed',
        actionTaken: 'dismissed',
        reviewedAt: new Date().toISOString()
      })
      
      showMessage('✅ Report dismissed')
      setReports(reports.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('Error dismissing report:', error)
      showMessage('❌ Failed to dismiss report', 'error')
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

  if (loading) return <div className="admin-loading">Loading reports...</div>

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <h2>🚩 Pending Reports</h2>
        <span className="admin-count">{reports.length} pending</span>
      </div>

      {message && (
        <div className={`admin-message ${messageType}`}>
          {message}
        </div>
      )}

      {reports.length === 0 ? (
        <div className="empty-state-admin">
          <div className="empty-icon">🎉</div>
          <h3>All Clear!</h3>
          <p>No pending reports to review. Keep up the good work!</p>
        </div>
      ) : (
        <div className="admin-list">
          {reports.map((report) => (
            <div key={report.id} className="admin-item-card report-card">
              <div className="admin-item-header">
                <div className="admin-item-meta">
                  <span className="admin-item-author">
                    📢 {report.targetType === 'post' ? 'Post' : 'Comment'}
                  </span>
                  <span className="report-reason-badge">
                    Reason: {report.reason || 'Not specified'}
                  </span>
                  <span className="admin-item-time">
                    🕐 {formatTime(report.timestamp)}
                  </span>
                </div>
              </div>
              
              <div className="admin-item-body">
                {report.targetTitle && (
                  <h4 className="admin-item-title">📝 {report.targetTitle}</h4>
                )}
                <p className="admin-item-content">
                  <strong>Reported by:</strong> {report.reportedByName || 'Anonymous'}<br />
                  <strong>Content:</strong> {report.targetContent}
                </p>
                <p className="admin-item-author">
                  <strong>Author of content:</strong> {report.targetAuthor || 'Unknown'}
                </p>
              </div>
              
              <div className="admin-item-actions">
                <button 
                  className="btn-delete"
                  onClick={() => deleteContent(report)}
                >
                  🗑️ Delete Content
                </button>
                <button 
                  className="btn-dismiss"
                  onClick={() => dismissReport(report.id)}
                >
                  ✅ Dismiss Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminReports