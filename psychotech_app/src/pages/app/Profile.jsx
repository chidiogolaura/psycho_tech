import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../../firebase'
import { 
  getUserProfile, 
  updateUserProfile, 
  changeUserPassword,
  deleteUserAccount,
  logoutUser,
  getCurrentUserId,
  getCurrentUserEmail
} from '../../services/firebaseService'
import './Profile.css'

function Profile() {
  // ========== STATE VARIABLES ==========
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState('')
  const [gender, setGender] = useState('')
  const [memberSince, setMemberSince] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  // Password change states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // Delete account states
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  const navigate = useNavigate()

  // ========== FETCH USER DATA ==========
  useEffect(() => {
    const userId = getCurrentUserId()
    
    if (!userId) {
      navigate('/login')
      return
    }
    
    fetchUserData(userId)
  }, [navigate])

  async function fetchUserData(userId) {
    setLoading(true)
    setError('')
    
    try {
      setEmail(getCurrentUserEmail() || 'No email')
      
      const userData = await getUserProfile(userId)
      setUserName(userData.displayName || '')
      setYearOfStudy(userData.yearOfStudy || '')
      setGender(userData.gender || '')
      
      if (userData.createdAt) {
        const date = new Date(userData.createdAt)
        setMemberSince(date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }))
      } else {
        setMemberSince('Recently')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError(error.message || 'Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  // ========== HANDLE PROFILE UPDATE ==========
  async function handleUpdateProfile(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const userId = getCurrentUserId()
      if (!userId) {
        navigate('/login')
        return
      }
      
      await updateUserProfile(userId, {
        displayName: userName,
        yearOfStudy: yearOfStudy,
        gender: gender
      })
      
      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      setTimeout(() => {
        fetchUserData(userId)
      }, 1000)
      
    } catch (error) {
      setError(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ========== HANDLE PASSWORD CHANGE ==========
  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordLoading(true)
    setError('')
    setSuccess('')
    
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match')
      setPasswordLoading(false)
      return
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      setPasswordLoading(false)
      return
    }
    
    try {
      await changeUserPassword(currentPassword, newPassword)
      setSuccess('Password changed successfully!')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setIsMenuOpen(false)
    } catch (error) {
      setError(error.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  // ========== HANDLE DELETE ACCOUNT ==========
  async function handleDeleteAccount() {
    setDeleteLoading(true)
    setError('')
    
    try {
      await deleteUserAccount(deletePassword)
      navigate('/login')
    } catch (error) {
      setError(error.message)
    } finally {
      setDeleteLoading(false)
      setDeletePassword('')
      setShowDeleteModal(false)
      setIsMenuOpen(false)
    }
  }

  // ========== HANDLE LOGOUT ==========
  async function handleLogout() {
    try {
      await logoutUser()
      navigate('/login')
    } catch (error) {
      setError('Failed to log out. Please try again.')
    }
  }

  // ========== HANDLE RETAKE TEST ==========
  const handleRetakeTest = () => {
    navigate('/assessment')
  }

  // ========== RENDER LOADING STATE ==========
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      {/* Visible Hamburger Menu Button */}
      <button 
        className={`profile-hamburger ${isMenuOpen ? 'active' : ''}`} 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Dropdown Menu - Edit Profile, Change Password, Logout, Delete Account */}
      {isMenuOpen && (
        <>
          <div className="profile-menu-overlay" onClick={() => setIsMenuOpen(false)}></div>
          <div className="profile-dropdown-menu">
            <button onClick={() => { setIsEditing(true); setIsMenuOpen(false); }} className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                <path d="M4 20h16" />
              </svg>
              Edit Profile
            </button>
            <button onClick={() => { setShowPasswordModal(true); setIsMenuOpen(false); }} className="menu-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Change Password
            </button>
            <button onClick={handleLogout} className="menu-item logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
            <button onClick={() => { setShowDeleteModal(true); setIsMenuOpen(false); }} className="menu-item danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete Account
            </button>
          </div>
        </>
      )}

      <div className="profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1>Profile</h1>
          <p>Manage your personal information and account settings</p>
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

        {/* Success Message */}
        {success && (
          <div className="success-message">
            <svg className="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </div>
        )}

        {/* Profile Info - Clean horizontal layout */}
        <div className="profile-info">
          <div className="info-row">
            <div className="info-item">
              <label>Email</label>
              <p>{email}</p>
            </div>
            <div className="info-item">
              <label>Display Name</label>
              <p>{userName || 'Not set'}</p>
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <label>Year of Study</label>
              <p>{yearOfStudy || 'Not specified'}</p>
            </div>
            <div className="info-item">
              <label>Gender</label>
              <p>{gender || 'Not specified'}</p>
            </div>
          </div>
          <div className="info-row">
            <div className="info-item">
              <label>Member Since</label>
              <p>{memberSince}</p>
            </div>
          </div>
        </div>

        {/* Edit Modal - Simple inline edit */}
        {isEditing && (
          <div className="edit-modal-overlay" onClick={() => setIsEditing(false)}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="edit-modal-header">
                <h3>Edit Profile</h3>
                <button className="close-btn" onClick={() => setIsEditing(false)}>×</button>
              </div>
              <form onSubmit={handleUpdateProfile} className="edit-modal-form">
                <div className="form-field">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>Year of Study</label>
                  <select value={yearOfStudy} onChange={(e) => setYearOfStudy(e.target.value)}>
                    <option value="">Select Year</option>
                    <option value="100L">100L - First Year</option>
                    <option value="200L">200L - Second Year</option>
                    <option value="300L">300L - Third Year</option>
                    <option value="400L">400L - Fourth Year</option>
                    <option value="500L">500L - Fifth Year</option>
                    <option value="600L">600L - Sixth Year</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Gender</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="edit-modal-actions">
                  <button type="button" onClick={() => setIsEditing(false)} className="cancel-edit-btn">Cancel</button>
                  <button type="submit" disabled={saving} className="save-edit-btn">{saving ? "Saving..." : "Save Changes"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Action List - Only Mental Health Assessment and Change Password */}
        <div className="action-list">
          {/* Assessment Action */}
          <div className="action-item" onClick={handleRetakeTest}>
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="action-details">
              <h4>Mental Health Assessment</h4>
              <p>Take a new assessment to track your mental health</p>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          {/* Password Action */}
          <div className="action-item" onClick={() => setShowPasswordModal(true)}>
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div className="action-details">
              <h4>Change Password</h4>
              <p>Update your password to keep your account secure</p>
            </div>
            <div className="action-arrow">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="profile-footer">
          <p>🔒 Your data is secure and private</p>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={passwordLoading} className="btn-primary">
                  {passwordLoading ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="warning-text">⚠️ This action cannot be undone!</p>
              <p>Your profile, assessments, and all data will be permanently deleted.</p>
              <div className="form-group">
                <label>Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                disabled={deleteLoading || !deletePassword}
                className="btn-danger-modal"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile