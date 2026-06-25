import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { doc, getDoc, collection, query, getDocs, orderBy, limit } from 'firebase/firestore'
import { getRandomTip, getGeneralTip } from '../../utils/tipsDatabase'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import './Dashboard.css'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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
  const [showFullHistory, setShowFullHistory] = useState(false)
  
  const navigate = useNavigate()

  // Update tip every hour
  const updateTip = () => {
    if (lastRiskLevel) {
      setCurrentTip(getRandomTip(lastRiskLevel))
    } else {
      setCurrentTip(getGeneralTip())
    }
  }

  useEffect(() => {
    updateTip()
    const interval = setInterval(() => updateTip(), 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [lastRiskLevel])

  // ========== HELPER FUNCTIONS ==========
  
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

  // Format date for chart labels
  function formatChartDate(timestamp) {
    if (!timestamp) return 'No date'
    try {
      const date = new Date(timestamp.toDate())
      return `${date.getMonth() + 1}/${date.getDate()}`
    } catch {
      return 'Invalid'
    }
  }

  // Format full date for display
  function formatFullDate(timestamp) {
    if (!timestamp) return 'No date'
    try {
      return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Invalid date'
    }
  }

  // Prepare chart data
  const getChartData = () => {
    if (assessments.length === 0) return null
    
    // Sort by date (oldest to newest for chart)
    const sortedAssessments = [...assessments].reverse()
    
    const labels = sortedAssessments.map(a => formatChartDate(a.timestamp))
    const phq9Scores = sortedAssessments.map(a => a.phq9_total)
    const gad7Scores = sortedAssessments.map(a => a.gad7_total)
    
    // Calculate trend (improving or worsening)
    if (phq9Scores.length >= 2) {
      const firstPhq9 = phq9Scores[0]
      const lastPhq9 = phq9Scores[phq9Scores.length - 1]
      const firstGad7 = gad7Scores[0]
      const lastGad7 = gad7Scores[gad7Scores.length - 1]
      
      const phq9Change = lastPhq9 - firstPhq9
      const gad7Change = lastGad7 - firstGad7
      
      if (phq9Change < 0 && gad7Change < 0) return { labels, phq9Scores, gad7Scores, trend: 'improving' }
      if (phq9Change > 0 && gad7Change > 0) return { labels, phq9Scores, gad7Scores, trend: 'worsening' }
      return { labels, phq9Scores, gad7Scores, trend: 'mixed' }
    }
    
    return { labels, phq9Scores, gad7Scores, trend: 'stable' }
  }

  const chartData = getChartData()
  
  const chartConfig = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        label: 'PHQ-9 (Depression)',
        data: chartData.phq9Scores,
        borderColor: '#7B6CB7',
        backgroundColor: 'rgba(123, 108, 183, 0.1)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#7B6CB7',
        pointBorderColor: '#fff',
        tension: 0.3,
        fill: true
      },
      {
        label: 'GAD-7 (Anxiety)',
        data: chartData.gad7Scores,
        borderColor: '#E6A817',
        backgroundColor: 'rgba(230, 168, 23, 0.05)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: '#E6A817',
        pointBorderColor: '#fff',
        tension: 0.3,
        fill: true
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Your Mental Health Journey',
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 27,
        title: {
          display: true,
          text: 'Score'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Assessment Date'
        }
      }
    }
  }

  // ========== MAIN DATA FETCHING ==========
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
      
      // Read all assessments (for chart)
      const assessmentsRef = collection(db, 'users', userId, 'assessments')
      const q = query(assessmentsRef, orderBy('timestamp', 'desc'))
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
  const displayedAssessments = showFullHistory ? assessments : assessments.slice(0, 5)

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

      {/* Trend Chart - NEW */}
      {assessments.length > 1 && chartData && (
        <section className="chart-section">
          <div className="section-header">
            <h3>📈 Score Trends</h3>
            <div className={`trend-badge ${chartData.trend}`}>
              {chartData.trend === 'improving' && '📉 Improving'}
              {chartData.trend === 'worsening' && '📈 Worsening'}
              {chartData.trend === 'mixed' && '🔄 Mixed'}
              {chartData.trend === 'stable' && '➡️ Stable'}
            </div>
          </div>
          <div className="chart-container">
            <Line data={chartConfig} options={chartOptions} />
          </div>
          <p className="chart-note">
            Lower scores indicate better mental health. {assessments.length} assessments total.
          </p>
        </section>
      )}

      {/* Quick Action Buttons */}
      <section className="quick-actions">
        <button className="action-btn" onClick={() => navigate('/assessment')}>
          <span className="btn-icon">📝</span>
          <span className="btn-text">Take Assessment</span>
        </button>
        <button className="action-btn" onClick={() => navigate('/community')}>
          <span className="btn-icon">💬</span>
          <span className="btn-text">Community</span>
        </button>
        <button className="action-btn" onClick={() => setShowFullHistory(!showFullHistory)}>
          <span className="btn-icon">📊</span>
          <span className="btn-text">{showFullHistory ? 'Show Less' : 'View All History'}</span>
        </button>
      </section>

      {/* Assessment History Table */}
      <section className="history-section">
        <div className="section-header">
          <h3>📋 Assessment History</h3>
          {assessments.length > 0 && (
            <span className="assessment-count">{assessments.length} total</span>
          )}
        </div>
        {assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No assessments yet</p>
            <button className="primary-btn" onClick={() => navigate('/assessment')}>
              Take Your First Assessment
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="assessments-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>PHQ-9</th>
                  <th>GAD-7</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {displayedAssessments.map((assessment) => {
                  const risk = getRiskLevel(assessment.phq9_total, assessment.gad7_total)
                  const display = getRiskDisplay(risk)
                  return (
                    <tr key={assessment.id}>
                      <td className="date-cell">{formatFullDate(assessment.timestamp)}</td>
                      <td className="score-cell">{assessment.phq9_total}</td>
                      <td className="score-cell">{assessment.gad7_total}</td>
                      <td className="risk-cell" style={{ color: display.color }}>
                        <span className="risk-dot" style={{ backgroundColor: display.color }}></span>
                        {risk}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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