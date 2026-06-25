import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import './login.css'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const navigate = useNavigate()

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('Signed in:', user.email)
      navigate('/dashboard')
      
    } catch (error) {
      console.log(error.message)
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.')
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Try again.')
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header with Logo */}
        <div className="login-header">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1>PsychoTech</h1>
          <p>Your Mental Health Companion</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSignIn} className="login-form">
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          </div>

          {/* Password Field with Toggle */}
          <div className="form-group">
            <label className="form-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          </div>

          {/* Login Button */}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* Signup Link */}
          <div className="signup-link">
            <p>
              Don't have an account? <Link to="/signup">Create Account</Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>🔒 Your mental health journey starts here</p>
        </div>
      </div>
    </div>
  )
}

export default Login