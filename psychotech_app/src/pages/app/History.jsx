import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { collection, query, getDocs, orderBy, where, doc, getDoc } from 'firebase/firestore'
import './History.css'

function History() {
  const [assessments, setAssessments] = useState([])
  const [filteredAssessments, setFilteredAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRisk, setFilterRisk] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [summary, setSummary] = useState({
    total: 0,
    avgPhq9: 0,
    avgGad7: 0,
    trend: 'stable',
    latestRisk: null
  })
  const navigate = useNavigate()

  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      navigate('/login')
      return
    }
    fetchHistory(currentUser.uid)
  }, [navigate])

  const fetchHistory = async (userId) => {
    setLoading(true)
    try {
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
      setFilteredAssessments(assessmentsList)
      calculateSummary(assessmentsList)
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateSummary = (data) => {
    if (data.length === 0) {
      setSummary({ total: 0, avgPhq9: 0, avgGad7: 0, trend: 'stable', latestRisk: null })
      return
    }

    const total = data.length
    const avgPhq9 = data.reduce((sum, a) => sum + (a.phq9_total || 0), 0) / total
    const avgGad7 = data.reduce((sum, a) => sum + (a.gad7_total || 0), 0) / total
    const latestRisk = data[0]?.risk_level || null

    // Calculate trend
    let trend = 'stable'
    if (data.length >= 2) {
      const first = data[data.length - 1]
      const last = data[0]
      if (first && last) {
        const phq9Change = (last.phq9_total || 0) - (first.phq9_total || 0)
        const gad7Change = (last.gad7_total || 0) - (first.gad7_total || 0)
        if (phq9Change < 0 && gad7Change < 0) trend = 'improving'
        else if (phq9Change > 0 && gad7Change > 0) trend = 'worsening'
        else trend = 'mixed'
      }
    }

    setSummary({ total, avgPhq9, avgGad7, trend, latestRisk })
  }

  const applyFilters = () => {
    let filtered = [...assessments]

    // Apply risk filter
    if (filterRisk !== 'all') {
      filtered = filtered.filter(a => a.risk_level === filterRisk)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal, bVal
      switch (sortBy) {
        case 'date':
          aVal = a.timestamp?.toDate?.() || new Date(a.timestamp)
          bVal = b.timestamp?.toDate?.() || new Date(b.timestamp)
          break
        case 'phq9':
          aVal = a.phq9_total || 0
          bVal = b.phq9_total || 0
          break
        case 'gad7':
          aVal = a.gad7_total || 0
          bVal = b.gad7_total || 0
          break
        case 'risk':
          const riskOrder = { 'Low Risk': 0, 'Moderate Risk': 1, 'High Risk': 2 }
          aVal = riskOrder[a.risk_level] || 0
          bVal = riskOrder[b.risk_level] || 0
          break
        default:
          aVal = a.timestamp?.toDate?.() || new Date(a.timestamp)
          bVal = b.timestamp?.toDate?.() || new Date(b.timestamp)
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    setFilteredAssessments(filtered)
  }

  useEffect(() => {
    applyFilters()
  }, [filterRisk, sortBy, sortOrder, assessments])

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Invalid date'
    }
  }

  const getRiskDisplay = (riskLevel) => {
    if (riskLevel === 'High Risk') {
      return { color: '#C0392B', emoji: '🔴', bg: '#FEE2E2', border: '#C0392B' }
    }
    if (riskLevel === 'Moderate Risk') {
      return { color: '#E6A817', emoji: '🟡', bg: '#FEF3C7', border: '#E6A817' }
    }
    return { color: '#2D6A4F', emoji: '🟢', bg: '#D8F3DC', border: '#2D6A4F' }
  }

  const getTrendLabel = () => {
    const labels = {
      'improving': '📉 Improving',
      'worsening': '📈 Worsening',
      'mixed': '🔄 Mixed',
      'stable': '➡️ Stable'
    }
    return labels[summary.trend] || '➡️ Stable'
  }

  const getTrendColor = () => {
    const colors = {
      'improving': '#2D6A4F',
      'worsening': '#C0392B',
      'mixed': '#E6A817',
      'stable': '#6B6B7A'
    }
    return colors[summary.trend] || '#6B6B7A'
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return '⇅'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const handleExportCSV = () => {
    if (filteredAssessments.length === 0) {
      alert('No data to export')
      return
    }

    const headers = ['Date', 'PHQ-9 Score', 'GAD-7 Score', 'Risk Level']
    const rows = filteredAssessments.map(a => [
      formatDate(a.timestamp),
      a.phq9_total || 0,
      a.gad7_total || 0,
      a.risk_level || 'Unknown'
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `psychotech_history_${new Date().toISOString().slice(0,10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner"></div>
        <p>Loading your history...</p>
      </div>
    )
  }

  return (
    <div className="history-container">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>📋 Assessment History</h1>
          <p className="history-subtitle">Track your mental health journey over time</p>
        </div>
        <div className="history-actions">
          <button onClick={handleExportCSV} className="btn-export">
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-info">
            <h3>{summary.total}</h3>
            <p>Total Assessments</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-info">
            <h3>{summary.avgPhq9.toFixed(1)}</h3>
            <p>Average PHQ-9 Score</p>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📉</div>
          <div className="summary-info">
            <h3>{summary.avgGad7.toFixed(1)}</h3>
            <p>Average GAD-7 Score</p>
          </div>
        </div>
        <div className="summary-card" style={{ borderColor: getTrendColor() }}>
          <div className="summary-icon">🔄</div>
          <div className="summary-info">
            <h3 style={{ color: getTrendColor() }}>{getTrendLabel()}</h3>
            <p>Overall Trend</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Filter by Risk:</label>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
            <option value="all">All Risks</option>
            <option value="Low Risk">🟢 Low Risk</option>
            <option value="Moderate Risk">🟡 Moderate Risk</option>
            <option value="High Risk">🔴 High Risk</option>
          </select>
        </div>
        <div className="filter-group">
          <span className="result-count">{filteredAssessments.length} results</span>
        </div>
      </div>

      {/* Table */}
      {filteredAssessments.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📭</div>
          <h3>No Assessments Found</h3>
          <p>You haven't taken any assessments yet.</p>
          <button className="btn-primary" onClick={() => navigate('/assessment')}>
            Take Your First Assessment
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date {getSortIcon('date')}
                </th>
                <th onClick={() => handleSort('phq9')} className="sortable">
                  PHQ-9 {getSortIcon('phq9')}
                </th>
                <th onClick={() => handleSort('gad7')} className="sortable">
                  GAD-7 {getSortIcon('gad7')}
                </th>
                <th onClick={() => handleSort('risk')} className="sortable">
                  Risk Level {getSortIcon('risk')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.map((assessment) => {
                const riskDisplay = getRiskDisplay(assessment.risk_level)
                return (
                  <tr key={assessment.id}>
                    <td className="date-cell">{formatDate(assessment.timestamp)}</td>
                    <td className="score-cell">{assessment.phq9_total || 0}</td>
                    <td className="score-cell">{assessment.gad7_total || 0}</td>
                    <td className="risk-cell" style={{ color: riskDisplay.color }}>
                      <span className="risk-dot" style={{ backgroundColor: riskDisplay.color }}></span>
                      {assessment.risk_level || 'Unknown'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default History