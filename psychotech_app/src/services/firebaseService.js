import { auth, db } from '../firebase'
import { 
  doc, 
  getDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit,
  writeBatch,
  addDoc
} from 'firebase/firestore'
import { 
  updateProfile, 
  updatePassword, 
  signOut, 
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'

// ========================================
// PROFILE FUNCTIONS (Using profile sub-collection)
// ========================================

// Get user profile from Firestore
export async function getUserProfile(userId) {
  try {
    const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
    const profileDoc = await getDoc(profileDocRef)
    
    if (profileDoc.exists()) {
      return profileDoc.data()
    } else {
      throw new Error('User profile not found')
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

// Create or update user profile
export async function setUserProfile(userId, profileData) {
  try {
    const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
    await setDoc(profileDocRef, profileData, { merge: true })
    return { success: true, message: 'Profile saved successfully' }
  } catch (error) {
    console.error('Error saving user profile:', error)
    throw error
  }
}

// Update user profile
export async function updateUserProfile(userId, userData) {
  try {
    const currentUser = auth.currentUser
    
    // Update Firebase Auth display name if changed
    if (userData.displayName && userData.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, {
        displayName: userData.displayName
      })
    }
    
    // Update Firestore profile document
    const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
    await updateDoc(profileDocRef, {
      ...userData,
      updatedAt: new Date().toISOString()
    })
    
    return { success: true, message: 'Profile updated successfully' }
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

// ========================================
// ASSESSMENT FUNCTIONS (Using assessments sub-collection)
// ========================================

// Save a new assessment
export async function saveAssessment(userId, assessmentData) {
  try {
    const assessmentsRef = collection(db, 'users', userId, 'assessments')
    const docRef = await addDoc(assessmentsRef, {
      ...assessmentData,
      createdAt: new Date().toISOString()
    })
    return { success: true, id: docRef.id, message: 'Assessment saved successfully' }
  } catch (error) {
    console.error('Error saving assessment:', error)
    throw error
  }
}

// Get user's assessments (with limit and ordering)
export async function getUserAssessments(userId, limitCount = 5) {
  try {
    const assessmentsRef = collection(db, 'users', userId, 'assessments')
    const q = query(assessmentsRef, orderBy('timestamp', 'desc'), limit(limitCount))
    const querySnapshot = await getDocs(q)
    
    const assessmentsList = []
    querySnapshot.forEach((doc) => {
      assessmentsList.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return assessmentsList
  } catch (error) {
    console.error('Error fetching assessments:', error)
    throw error
  }
}

// Get the most recent assessment
export async function getLatestAssessment(userId) {
  try {
    const assessments = await getUserAssessments(userId, 1)
    return assessments.length > 0 ? assessments[0] : null
  } catch (error) {
    console.error('Error fetching latest assessment:', error)
    throw error
  }
}

// ========================================
// PASSWORD FUNCTIONS
// ========================================

// Change user password
export async function changeUserPassword(currentPassword, newPassword) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')
    
    // Re-authenticate user before changing password
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    
    // Update password
    await updatePassword(user, newPassword)
    
    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Error changing password:', error)
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect')
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password must be at least 6 characters')
    } else {
      throw new Error('Failed to change password. Please try again.')
    }
  }
}

// ========================================
// DELETE ACCOUNT FUNCTIONS
// ========================================

// Delete user's assessment history
async function deleteUserAssessments(userId) {
  try {
    const assessmentsRef = collection(db, 'users', userId, 'assessments')
    const querySnapshot = await getDocs(assessmentsRef)
    
    const batch = writeBatch(db)
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref)
    })
    await batch.commit()
    
    return true
  } catch (error) {
    console.error('Error deleting assessments:', error)
    throw error
  }
}

// Delete user profile
async function deleteUserProfile(userId) {
  try {
    const profileDocRef = doc(db, 'users', userId, 'profile', 'details')
    await deleteDoc(profileDocRef)
    return true
  } catch (error) {
    console.error('Error deleting profile:', error)
    throw error
  }
}

// Delete user's posts and comments (for community feature)
async function deleteUserContent(userId) {
  try {
    const postsRef = collection(db, 'posts')
    const postsQuery = query(postsRef)
    const postsSnapshot = await getDocs(postsQuery)
    
    const batch = writeBatch(db)
    postsSnapshot.forEach((doc) => {
      const postData = doc.data()
      if (postData.userId === userId) {
        batch.delete(doc.ref)
      }
    })
    await batch.commit()
    
    return true
  } catch (error) {
    console.error('Error deleting user content:', error)
    throw error
  }
}

// Delete entire user account
export async function deleteUserAccount(password) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No user logged in')
    
    // Re-authenticate user before deleting account
    const credential = EmailAuthProvider.credential(user.email, password)
    await reauthenticateWithCredential(user, credential)
    
    const userId = user.uid
    
    // Delete user's assessments
    await deleteUserAssessments(userId)
    
    // Delete user's profile
    await deleteUserProfile(userId)
    
    // Delete user's posts and comments
    await deleteUserContent(userId)
    
    // Finally, delete the user from Firebase Auth
    await deleteUser(user)
    
    return { success: true, message: 'Account deleted successfully' }
  } catch (error) {
    console.error('Error deleting account:', error)
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('Password is incorrect')
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Please log out and log in again before deleting your account')
    } else {
      throw new Error('Failed to delete account. Please try again.')
    }
  }
}

// ========================================
// LOGOUT FUNCTION
// ========================================

export async function logoutUser() {
  try {
    await signOut(auth)
    return { success: true, message: 'Logged out successfully' }
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

// Get current user ID
export function getCurrentUserId() {
  const user = auth.currentUser
  return user ? user.uid : null
}

// Get current user email
export function getCurrentUserEmail() {
  const user = auth.currentUser
  return user ? user.email : null
}

// Check if user is logged in
export function isUserLoggedIn() {
  return auth.currentUser !== null
}