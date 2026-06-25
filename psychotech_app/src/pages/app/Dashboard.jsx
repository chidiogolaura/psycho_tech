import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { doc, getDoc, collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { getRandomTip, getGeneralTip } from '../../utils/tipsDatabase'
import './Dashboard.css'

function Dashboard() {
  // ========== STATE VARIABLES ==========
  const [userName, setUserName] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRiskLevel, setLastRiskLevel] = useState(null)
  const [lastPhq9, setLastPhq9] = useState(null)
  const [lastGad7, setLastGad7] = useState(null)
  const [currentTip, setCurrentTip] = useState('✨ Loading tips...')
  
  const navigate = useNavigate()

  const updateTip = () => {
    if (lastRiskLevel) {
      setCurrentTip(getRandomTip(lastRiskLevel))
    } else {
      setCurrentTip(getGeneralTip())
    }
  }

  useEffect(() => {
    updateTip()
    const interval = setInterval(() => {
      updateTip()
    }, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [lastRiskLevel])

  function getRiskLevel(phq9, gad7) {
    if (phq9 >= 10 || gad7 >= 10) return 'High Risk'
    if (phq9 >= 5 || gad7 >= 5) return 'Moderate Risk'
    return 'Low Risk'
  }
  
  function getRiskDisplay(riskLevel) {
    if (riskLevel === 'High Risk') {
      return { color: '#C0392B', emoji: '🔴', bg: '#FEE2E2' }
    }
    if (riskLevel === 'Moderate Risk') {
      return { color: '#E6A817', emoji: '🟡', bg: '#FEF3C7' }
    }
    return { color: '#2D6A4F', emoji: '🟢', bg: '#D8F3DC' }
  }

  function getTimeOfDayDisplay() {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchUserData(currentUser.uid)
  }, [navigate])
  
  async function fetchUserData(userId) {
  setLoading(true)
  try {
    // Read profile from new structure: users/{userId}/profile/details
    const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
    const profileDoc = await getDoc(profileDocRef)
    
    if (profileDoc.exists()) {
      const userData = profileDoc.data()
      setUserName(userData.displayName || 'Student')
      setYearOfStudy(userData.yearOfStudy || 'Not specified')
    }
    
    // Read assessments from: users/{userId}/assessments
    const assessmentsRef = collection(db, 'users', userId, 'assessments')
    const q = query(assessmentsRef, orderBy('timestamp', 'desc'), limit(5))
    const querySnapshot = await getDocs(q)
    
    const assessmentsList = []
    querySnapshot.forEach((doc) => {
      assessmentsList.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    setAssessments(assessmentsList)
    
    if (assessmentsList.length > 0) {
      const latest = assessmentsList[0]
      setLastPhq9(latest.phq9_total)
      setLastGad7(latest.gad7_total)
      const risk = getRiskLevel(latest.phq9_total, latest.gad7_total)
      setLastRiskLevel(risk)
    } else {
      setLastRiskLevel(null)
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    setLoading(false)
  }
}

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  const riskDisplay = lastRiskLevel ? getRiskDisplay(lastRiskLevel) : null

  return (
    <div className="dashboard-container">
      {/* Welcome Section */}
      <section className="welcome-section">
        <h1>Welcome back, <span className="user-name">{userName}</span>!</h1>
        {yearOfStudy !== 'Not specified' && (
          <p className="user-badge">📚 {yearOfStudy} Student</p>
        )}
      </section>

      {/* Status Card */}
      <section className="status-card" style={{ backgroundColor: riskDisplay?.bg || '#F3F0FF' }}>
        <h3>Your Current Status</h3>
        {lastRiskLevel ? (
          <div className="status-content">
            <div className="risk-level" style={{ color: riskDisplay?.color }}>
              <span className="risk-emoji">{riskDisplay?.emoji}</span>
              <span className="risk-text">{lastRiskLevel}</span>
            </div>
            <div className="scores">
              <div className="score-item">
                <span className="score-label">PHQ-9</span>
                <span className="score-value">{lastPhq9}</span>
                <span className="score-range">/27</span>
              </div>
              <div className="score-divider"></div>
              <div className="score-item">
                <span className="score-label">GAD-7</span>
                <span className="score-value">{lastGad7}</span>
                <span className="score-range">/21</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-assessment">
            <p>📋 Take your first assessment to see your mental health status</p>
            <button className="primary-btn" onClick={() => navigate('/assessment')}>
              Take Assessment →
            </button>
          </div>
        )}
      </section>

      {/* Dynamic Tips Section */}
      <section className="tips-section">
        <div className="section-header">
          <h3>💡 Quick Tip for You</h3>
          <span className="tip-time-badge">✨ Changes every hour</span>
        </div>
        <div className="tip-content">
          <p className="current-tip">{currentTip}</p>
          <p className="tip-time-note">
            🌙 {getTimeOfDayDisplay()} time • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </section>
    </div>
  )
}

export default Dashboard