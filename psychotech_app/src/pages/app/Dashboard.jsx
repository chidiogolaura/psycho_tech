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

  function getRiskLevel(phq9, gad7) {
    if (phq9 >= 10 || gad7 >= 10) return 'High Risk'
    if (phq9 >= 5 || gad7 >= 5) return 'Moderate Risk'
    return 'Low Risk'
  }
  
  function getRiskDisplay(riskLevel) {
    if (riskLevel === 'High Risk') {
      return { color: '#C0392B', emoji: '🔴', bg: '#FEE2E2', border: '#C0392B' }
    }
    if (riskLevel === 'Moderate Risk') {
      return { color: '#E6A817', emoji: '🟡', bg: '#FEF3C7', border: '#E6A817' }
    }
    return { color: '#2D6A4F', emoji: '🟢', bg: '#D8F3DC', border: '#2D6A4F' }
  }

  function getTimeOfDayDisplay() {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 22) return 'evening'
    return 'night'
  }

  function formatChartDate(timestamp) {
    if (!timestamp) return 'No date'
    try {
      const date = new Date(timestamp.toDate())
      return `${date.getMonth() + 1}/${date.getDate()}`
    } catch {
      return 'Invalid'
    }
  }

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

  const getChartData = () => {
    if (assessments.length === 0) return null
    
    const sortedAssessments = [...assessments].reverse()
    const labels = sortedAssessments.map(a => formatChartDate(a.timestamp))
    const phq9Scores = sortedAssessments.map(a => a.phq9_total)
    const gad7Scores = sortedAssessments.map(a => a.gad7_total)
    
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
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#7B6CB7',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        tension: 0.3,
        fill: true
      },
      {
        label: 'GAD-7 (Anxiety)',
        data: chartData.gad7Scores,
        borderColor: '#E6A817',
        backgroundColor: 'rgba(230, 168, 23, 0.05)',
        borderWidth: 2.5,
        pointRadius: 4,
        pointBackgroundColor: '#E6A817',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
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
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(26, 26, 46, 0.9)',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 27,
        title: {
          display: true,
          text: 'Score',
          font: { size: 12 }
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        title: {
          display: true,
          text: 'Assessment Date',
          font: { size: 12 }
        },
        grid: { display: false }
      }
    }
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
      const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
      const profileDoc = await getDoc(profileDocRef)
      
      if (profileDoc.exists()) {
        const userData = profileDoc.data()
        setUserName(userData.displayName || 'Student')
        setYearOfStudy(userData.yearOfStudy || 'Not specified')
      }
      
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
      {/* ======================================== */}
      {/* WELCOME SECTION */}
      {/* ======================================== */}
      <div className="dashboard-welcome">
        <div className="welcome-text">
          <h1>Welcome back, <span className="user-name">{userName}</span>!</h1>
          {yearOfStudy !== 'Not specified' && (
            <span className="user-badge">📚 {yearOfStudy}</span>
          )}
        </div>
        <div className="welcome-date">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* ======================================== */}
      {/* STATUS CARD */}
      {/* ======================================== */}
      {lastRiskLevel ? (
        <div className="status-card" style={{ backgroundColor: riskDisplay?.bg }}>
          <div className="status-header">
            <span className="status-label">Current Status</span>
            <span className={`risk-badge ${lastRiskLevel.toLowerCase().replace(' ', '-')}`}>
              {riskDisplay?.emoji} {lastRiskLevel}
            </span>
          </div>
          <div className="status-content">
            <div className="status-scores">
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
        </div>
      ) : (
        <div className="status-card empty">
          <div className="empty-status">
            <div className="empty-icon">📋</div>
            <h3>No Assessment Yet</h3>
            <p>Take your first assessment to see your mental health status</p>
            <button className="primary-btn" onClick={() => navigate('/assessment')}>
              Take Assessment →
            </button>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* RISK LEVEL RANGES SECTION - NEW */}
      {/* ======================================== */}
      <div className="risk-ranges-section">
        <div className="section-header">
          <h3>📊 Understanding Your Risk Level</h3>
          <span className="info-badge">ℹ️ Based on PHQ-9 and GAD-7 scores</span>
        </div>
        
        <div className="risk-table-wrapper">
          <table className="risk-ranges-table">
            <thead>
              <tr>
                <th>Risk Level</th>
                <th>PHQ-9 Score</th>
                <th>GAD-7 Score</th>
                <th>What It Means</th>
              </tr>
            </thead>
            <tbody>
              <tr className={lastRiskLevel === 'Low Risk' ? 'current-risk' : ''}>
                <td><span className="risk-dot low"></span> 🟢 Low Risk</td>
                <td>0 – 4</td>
                <td>0 – 4</td>
                <td>Minimal symptoms</td>
              </tr>
              <tr className={lastRiskLevel === 'Moderate Risk' ? 'current-risk' : ''}>
                <td><span className="risk-dot moderate"></span> 🟡 Moderate Risk</td>
                <td>5 – 9</td>
                <td>5 – 9</td>
                <td>Some distress, monitor</td>
              </tr>
              <tr className={lastRiskLevel === 'High Risk' ? 'current-risk' : ''}>
                <td><span className="risk-dot high"></span> 🔴 High Risk</td>
                <td>10 – 27</td>
                <td>10 – 21</td>
                <td>Significant distress, seek help</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {lastRiskLevel && (
          <p className="current-risk-note">
            Your current score: PHQ-9 = {lastPhq9}, GAD-7 = {lastGad7} → <strong>{lastRiskLevel}</strong>
          </p>
        )}
      </div>

      {/* ======================================== */}
      {/* QUICK ACTION BUTTONS */}
      {/* ======================================== */}
      <div className="quick-actions-grid">
        <div className="quick-action-card" onClick={() => navigate('/assessment')}>
          <div className="quick-action-icon">📝</div>
          <div className="quick-action-info">
            <h4>Take Assessment</h4>
            <p>Complete a new mental health screening</p>
          </div>
          <div className="quick-action-arrow">→</div>
        </div>
        <div className="quick-action-card" onClick={() => navigate('/community')}>
          <div className="quick-action-icon">💬</div>
          <div className="quick-action-info">
            <h4>Community</h4>
            <p>Connect with peers anonymously</p>
          </div>
          <div className="quick-action-arrow">→</div>
        </div>
        <div className="quick-action-card" onClick={() => setShowFullHistory(!showFullHistory)}>
          <div className="quick-action-icon">📊</div>
          <div className="quick-action-info">
            <h4>{showFullHistory ? 'Show Less' : 'View All History'}</h4>
            <p>{assessments.length} assessments total</p>
          </div>
          <div className="quick-action-arrow">{showFullHistory ? '←' : '→'}</div>
        </div>
      </div>

      {/* ======================================== */}
      {/* CHART SECTION */}
      {/* ======================================== */}
      {assessments.length > 1 && chartData && (
        <div className="chart-section">
          <div className="chart-header">
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
        </div>
      )}

      {/* ======================================== */}
      {/* HISTORY TABLE */}
      {/* ======================================== */}
      <div className="history-section">
        <div className="history-header">
          <h3>📋 Assessment History</h3>
          {assessments.length > 0 && (
            <span className="assessment-count">{assessments.length} total</span>
          )}
        </div>
        {assessments.length === 0 ? (
          <div className="empty-history">
            <p>No assessments yet</p>
            <button className="primary-btn small" onClick={() => navigate('/assessment')}>
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
      </div>

      {/* ======================================== */}
      {/* TIPS SECTION */}
      {/* ======================================== */}
      <div className="tips-section">
        <div className="tips-header">
          <h3>💡 Quick Tip for You</h3>
          <span className="tip-badge">✨ Changes every hour</span>
        </div>
        <div className="tips-content">
          <p className="current-tip">{currentTip}</p>
          <p className="tip-time">
            {getTimeOfDayDisplay()} time • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard