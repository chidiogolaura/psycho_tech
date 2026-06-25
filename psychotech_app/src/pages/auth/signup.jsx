import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth, db } from '../../firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import './signup.css'

function Signup() {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [gender, setGender] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const navigate = useNavigate()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validation checks
    if (password !== confirmPassword) {
      setError("Passwords don't match!")
      return
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    
    if (userName.trim() === '') {
      setError("Please enter a display name")
      return
    }
    
    if (email.trim() === '') {
      setError("Please enter your email")
      return
    }
    
    setLoading(true)
    
    try {
      // STEP 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // STEP 2: Update the user's profile with display name
      await updateProfile(user, {
        displayName: userName
      })
      
      // STEP 3: Save additional user data to Firestore
      // Path: users/{userId}/profile/details
      const profileDocRef = doc(db, 'users', user.uid, 'profile', 'details')
      await setDoc(profileDocRef, {
        displayName: userName,
        email: email,
        yearOfStudy: yearOfStudy || 'Not specified',
        gender: gender || 'Not specified',
        createdAt: new Date().toISOString(),
        role: 'student'
      })
      
      // Redirect to login page
      navigate('/login')
      
    } catch (error) {
      console.log('Signup error:', error.message)
      
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.')
      } else {
        setError('Failed to create account. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <h1>Create Account</h1>
          <p>Join our community and start your mental health journey</p>
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

        {/* Form */}
        <form onSubmit={handleSignUp} className="signup-form">
          {/* User Name */}
          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Display Name
            </label>
            <input
              type="text"
              className="form-input"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g., CalmStudent, TechLearner"
              required
            />
            <p className="form-hint">
              <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="12" x2="12" y2="16" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Others will see this name in the community
            </p>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 7L2 7" />
              </svg>
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <p className="form-hint">
              <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your email is private and will never be shared
            </p>
          </div>

          {/* Password with Toggle - SIMPLE EYE ICON */}
          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                tabIndex="-1"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <p className="form-hint">
              <svg className="hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Must be at least 6 characters
            </p>
          </div>

          {/* Confirm Password with Toggle - SIMPLE EYE ICON */}
          <div className="form-group">
            <label className="form-label">
              <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Confirm Password
            </label>
            <div className="password-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-input password-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                tabIndex="-1"
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Year of Study and Gender - Two Column Layout */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                Year of Study
              </label>
              <select
                className="form-select"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
              >
                <option value="">Select Year</option>
                <option value="100L">100L - First Year</option>
                <option value="200L">200L - Second Year</option>
                <option value="300L">300L - Third Year</option>
                <option value="400L">400L - Fourth Year</option>
                <option value="500L">500L - Fifth Year</option>
                <option value="600L">600L - Sixth Year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg className="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Gender
              </label>
              <select
                className="form-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="signup-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Login Link */}
        <div className="login-link">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>

        {/* Footer */}
        <div className="signup-footer">
          <p>🔒 Your data is secure. We respect your privacy.</p>
        </div>
      </div>
    </div>
  )
}

export default Signup