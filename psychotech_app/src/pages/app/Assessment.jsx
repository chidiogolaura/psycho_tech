import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import './Assessment.css'

function Assessment() {
  const navigate = useNavigate()
  
  // ========== STATE VARIABLES ==========
  const [currentStep, setCurrentStep] = useState(1) // 1-6
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // ========== STEP 1: DEMOGRAPHICS ==========
  const [age, setAge] = useState('')
  const [gender, setGender] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  
  // ========== STEP 2: ACADEMIC FACTORS ==========
  const [cgpa, setCgpa] = useState('')
  const [studyHours, setStudyHours] = useState('')
  const [academicStress, setAcademicStress] = useState('')
  
  // ========== STEP 3: LIFESTYLE FACTORS ==========
  const [sleepDuration, setSleepDuration] = useState('')
  const [physicalActivity, setPhysicalActivity] = useState('')
  
  // ========== STEP 4: SOCIO-ENVIRONMENTAL ==========
  const [financialStress, setFinancialStress] = useState('')
  const [senseOfBelonging, setSenseOfBelonging] = useState('')
  const [socialSupport, setSocialSupport] = useState('')
  
  // ========== STEP 5: PHQ-9 (Depression) ==========
  const [phq9Answers, setPhq9Answers] = useState({
    q1: null, q2: null, q3: null, q4: null,
    q5: null, q6: null, q7: null, q8: null, q9: null
  })
  
  // ========== STEP 6: GAD-7 (Anxiety) ==========
  const [gad7Answers, setGad7Answers] = useState({
    q1: null, q2: null, q3: null, q4: null,
    q5: null, q6: null, q7: null
  })
  
  const phq9Questions = [
    "Little interest or pleasure in doing things?",
    "Feeling down, depressed, or hopeless?",
    "Trouble falling or staying asleep, or sleeping too much?",
    "Feeling tired or having little energy?",
    "Poor appetite or overeating?",
    "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
    "Trouble concentrating on things, such as reading the newspaper or watching television?",
    "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
    "Thoughts that you would be better off dead, or of hurting yourself?"
  ]
  
  const gad7Questions = [
    "Feeling nervous, anxious, or on edge?",
    "Not being able to stop or control worrying?",
    "Worrying too much about different things?",
    "Trouble relaxing?",
    "Being so restless that it is hard to sit still?",
    "Becoming easily annoyed or irritable?",
    "Feeling afraid as if something awful might happen?"
  ]
  
  const options = [
    { value: 0, label: "Not at all" },
    { value: 1, label: "Several days" },
    { value: 2, label: "More than half the days" },
    { value: 3, label: "Nearly every day" }
  ]
  
  const stressOptions = [
    { value: "Low", label: "Low - I manage well" },
    { value: "Moderate", label: "Moderate - Sometimes overwhelming" },
    { value: "High", label: "High - Frequently overwhelmed" }
  ]
  
  const belongingOptions = [
    { value: "Low", label: "Low - I feel isolated" },
    { value: "Moderate", label: "Moderate - I have some connections" },
    { value: "High", label: "High - I feel part of a community" }
  ]
  
  const supportOptions = [
    { value: "Low", label: "Low - I have few people to turn to" },
    { value: "Moderate", label: "Moderate - I have some support" },
    { value: "High", label: "High - I have strong support system" }
  ]

  // Check if user is logged in
  useEffect(() => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      navigate('/login')
    }
  }, [navigate])

  // Calculate scores
  const calculatePhq9Score = () => {
    let total = 0
    for (let key in phq9Answers) {
      if (phq9Answers[key] !== null) {
        total += phq9Answers[key]
      }
    }
    return total
  }
  
  const calculateGad7Score = () => {
    let total = 0
    for (let key in gad7Answers) {
      if (gad7Answers[key] !== null) {
        total += gad7Answers[key]
      }
    }
    return total
  }
  
  // Check if current step is complete
  const isStepComplete = () => {
    switch(currentStep) {
      case 1:
        return age && gender && yearOfStudy
      case 2:
        return cgpa && studyHours && academicStress
      case 3:
        return sleepDuration && physicalActivity
      case 4:
        return financialStress && senseOfBelonging && socialSupport
      case 5:
        for (let key in phq9Answers) {
          if (phq9Answers[key] === null) return false
        }
        return true
      case 6:
        for (let key in gad7Answers) {
          if (gad7Answers[key] === null) return false
        }
        return true
      default:
        return false
    }
  }
  
  // Go to next step
  const handleNext = () => {
    if (isStepComplete()) {
      setCurrentStep(currentStep + 1)
      window.scrollTo(0, 0)
    } else {
      setError('Please answer all questions before continuing')
      setTimeout(() => setError(''), 3000)
    }
  }
  
  // Go to previous step
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
    window.scrollTo(0, 0)
  }
  
  // Submit assessment
 // Submit assessment
const handleSubmit = async () => {
  if (!isStepComplete()) {
    setError('Please answer all questions before submitting')
    setTimeout(() => setError(''), 3000)
    return
  }
  
  setLoading(true)
  
  try {
    const userId = auth.currentUser?.uid
    if (!userId) {
      navigate('/login')
      return
    }
    
    const phq9Score = calculatePhq9Score()
    const gad7Score = calculateGad7Score()
    
    const assessmentData = {
      // Step 1: Demographics
      age: parseInt(age),
      gender: gender,
      year_of_study: yearOfStudy,
      
      // Step 2: Academic Factors
      cgpa: parseFloat(cgpa),
      study_hours_per_day: parseInt(studyHours),
      academic_stress: academicStress,
      
      // Step 3: Lifestyle Factors
      sleep_hours_per_night: parseInt(sleepDuration),
      physical_activity_days_per_week: parseInt(physicalActivity),
      
      // Step 4: Socio-environmental Factors
      financial_stress: financialStress,
      sense_of_belonging: senseOfBelonging,
      social_support: socialSupport,
      
      // Step 5: PHQ-9 Scores
      phq9_total: phq9Score,
      phq9_q1: phq9Answers.q1,
      phq9_q2: phq9Answers.q2,
      phq9_q3: phq9Answers.q3,
      phq9_q4: phq9Answers.q4,
      phq9_q5: phq9Answers.q5,
      phq9_q6: phq9Answers.q6,
      phq9_q7: phq9Answers.q7,
      phq9_q8: phq9Answers.q8,
      phq9_q9: phq9Answers.q9,
      
      // Step 6: GAD-7 Scores
      gad7_total: gad7Score,
      gad7_q1: gad7Answers.q1,
      gad7_q2: gad7Answers.q2,
      gad7_q3: gad7Answers.q3,
      gad7_q4: gad7Answers.q4,
      gad7_q5: gad7Answers.q5,
      gad7_q6: gad7Answers.q6,
      gad7_q7: gad7Answers.q7,
      
      timestamp: new Date().toISOString()
    }
    
    // Call ML API for prediction
    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      })
      const result = await response.json()
      assessmentData.risk_level = result.success ? result.risk_level : getFallbackRiskLevel(phq9Score, gad7Score)
    } catch (error) {
      console.error('ML API error:', error)
      assessmentData.risk_level = getFallbackRiskLevel(phq9Score, gad7Score)
    }
    
    // Save to Firestore: users/{userId}/assessments/{autoId}
    const assessmentsRef = collection(db, 'users', userId, 'assessments')
    await addDoc(assessmentsRef, assessmentData)
    
    navigate('/dashboard')
    
  } catch (error) {
    console.error('Error saving assessment:', error)
    setError('Failed to save assessment. Please try again.')
    setTimeout(() => setError(''), 3000)
  } finally {
    setLoading(false)
  }
}
  
  const getFallbackRiskLevel = (phq9, gad7) => {
    if (phq9 >= 10 || gad7 >= 10) return 'High Risk'
    if (phq9 >= 5 || gad7 >= 5) return 'Moderate Risk'
    return 'Low Risk'
  }
  
  const getStepTitle = () => {
    const titles = {
      1: "About You",
      2: "Academic Life",
      3: "Lifestyle & Health",
      4: "Your Environment",
      5: "Depression Screening (PHQ-9)",
      6: "Anxiety Screening (GAD-7)"
    }
    return titles[currentStep]
  }
  
  const getStepDescription = () => {
    const descriptions = {
      1: "Tell us a bit about yourself",
      2: "Help us understand your academic experience",
      3: "Share your daily habits and routines",
      4: "Understanding your support systems",
      5: "9 questions about how you've felt over the past 2 weeks",
      6: "7 questions about anxiety symptoms over the past 2 weeks"
    }
    return descriptions[currentStep]
  }

  return (
    <div className="assessment-container">
      <div className="assessment-card">
        {/* Header */}
        <div className="assessment-header">
          <h1>Mental Health Assessment</h1>
          <p>Complete all sections for a comprehensive evaluation</p>
          
          {/* Progress Bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentStep / 6) * 100}%` }}></div>
          </div>
          <div className="progress-text">
            Step {currentStep} of 6
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="step-content">
          <div className="step-header">
            <h2>{getStepTitle()}</h2>
            <p>{getStepDescription()}</p>
          </div>
          
          {/* STEP 1: Demographics */}
          {currentStep === 1 && (
            <div className="step-questions">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  min="18"
                  max="65"
                />
              </div>
              
              <div className="form-group">
                <label>Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Year of Study</label>
                <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)}>
                  <option value="">Select Year</option>
                  <option value="100L">100L - First Year</option>
                  <option value="200L">200L - Second Year</option>
                  <option value="300L">300L - Third Year</option>
                  <option value="400L">400L - Fourth Year</option>
                  <option value="500L">500L - Fifth Year</option>
                  <option value="600L">600L - Sixth Year+</option>
                </select>
              </div>
            </div>
          )}
          
          {/* STEP 2: Academic Factors */}
          {currentStep === 2 && (
            <div className="step-questions">
              <div className="form-group">
                <label>CGPA (0.00 - 5.00)</label>
                <input
                  type="number"
                  step="0.01"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  placeholder="e.g., 3.50"
                  min="0"
                  max="5"
                />
              </div>
              
              <div className="form-group">
                <label>Average Study Hours Per Day</label>
                <input
                  type="number"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  placeholder="Hours per day"
                  min="0"
                  max="20"
                />
              </div>
              
              <div className="form-group">
                <label>Perceived Academic Stress</label>
                <select value={academicStress} onChange={(e) => setAcademicStress(e.target.value)}>
                  <option value="">Select Level</option>
                  {stressOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* STEP 3: Lifestyle Factors */}
          {currentStep === 3 && (
            <div className="step-questions">
              <div className="form-group">
                <label>Average Sleep Duration (hours per night)</label>
                <input
                  type="number"
                  value={sleepDuration}
                  onChange={(e) => setSleepDuration(e.target.value)}
                  placeholder="Hours per night"
                  min="0"
                  max="16"
                />
              </div>
              
              <div className="form-group">
                <label>Physical Activity (days per week)</label>
                <input
                  type="number"
                  value={physicalActivity}
                  onChange={(e) => setPhysicalActivity(e.target.value)}
                  placeholder="Days per week"
                  min="0"
                  max="7"
                />
                <small>30+ minutes of moderate exercise</small>
              </div>
            </div>
          )}
          
          {/* STEP 4: Socio-environmental Factors */}
          {currentStep === 4 && (
            <div className="step-questions">
              <div className="form-group">
                <label>Financial Stress</label>
                <select value={financialStress} onChange={(e) => setFinancialStress(e.target.value)}>
                  <option value="">Select Level</option>
                  {stressOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Sense of Belonging at University</label>
                <select value={senseOfBelonging} onChange={(e) => setSenseOfBelonging(e.target.value)}>
                  <option value="">Select Level</option>
                  {belongingOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Social Support System</label>
                <select value={socialSupport} onChange={(e) => setSocialSupport(e.target.value)}>
                  <option value="">Select Level</option>
                  {supportOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {/* STEP 5: PHQ-9 Questions */}
          {currentStep === 5 && (
            <div className="step-questions">
              {phq9Questions.map((question, index) => (
                <div key={`phq9-${index}`} className="question-card">
                  <div className="question-text">
                    <span className="question-number">{index + 1}</span>
                    <p>{question}</p>
                  </div>
                  <div className="options-grid">
                    {options.map(option => (
                      <label key={option.value} className="option-label">
                        <input
                          type="radio"
                          name={`phq9_q${index + 1}`}
                          value={option.value}
                          checked={phq9Answers[`q${index + 1}`] === option.value}
                          onChange={() => setPhq9Answers(prev => ({ ...prev, [`q${index + 1}`]: option.value }))}
                        />
                        <span className="option-text">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* STEP 6: GAD-7 Questions */}
          {currentStep === 6 && (
            <div className="step-questions">
              {gad7Questions.map((question, index) => (
                <div key={`gad7-${index}`} className="question-card">
                  <div className="question-text">
                    <span className="question-number">{index + 1}</span>
                    <p>{question}</p>
                  </div>
                  <div className="options-grid">
                    {options.map(option => (
                      <label key={option.value} className="option-label">
                        <input
                          type="radio"
                          name={`gad7_q${index + 1}`}
                          value={option.value}
                          checked={gad7Answers[`q${index + 1}`] === option.value}
                          onChange={() => setGad7Answers(prev => ({ ...prev, [`q${index + 1}`]: option.value }))}
                        />
                        <span className="option-text">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Navigation Buttons */}
          <div className="step-actions">
            {currentStep > 1 && (
              <button className="prev-btn" onClick={handlePrevious}>
                ← Previous
              </button>
            )}
            
            {currentStep < 6 ? (
              <button className="next-btn" onClick={handleNext}>
                Next →
              </button>
            ) : (
              <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Assessment"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Assessment