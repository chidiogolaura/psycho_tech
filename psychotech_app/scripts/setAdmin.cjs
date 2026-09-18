const { initializeApp, cert } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

// Load service account
const serviceAccount = require('../serviceAccountKey.json')

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
})

const auth = getAuth()
const ADMIN_EMAIL = 'umeozuluchidiogo@gmail.com'

async function setAdmin() {
  console.log('\n========================================')
  console.log('🔑 SETTING ADMIN CLAIM')
  console.log('========================================\n')

  try {
    // Get user by email
    const user = await auth.getUserByEmail(ADMIN_EMAIL)
    console.log(`✅ User found: ${user.uid}`)

    // Set custom claim
    await auth.setCustomUserClaims(user.uid, { admin: true })
    console.log(`✅ Admin claim set!`)

    // Verify
    const updated = await auth.getUser(user.uid)
    console.log(`✅ Verified: admin = ${updated.customClaims?.admin}`)

    console.log('\n========================================')
    console.log('✅ SUCCESS!')
    console.log('========================================')
    console.log(`\n📧 ${ADMIN_EMAIL} is now an ADMIN.`)
    console.log('\n⚠️ Log out and log back in.\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

setAdmin()