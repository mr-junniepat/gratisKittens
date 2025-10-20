import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface Profile {
  id: string
  email: string
  username: string
  display_name: string
  needs_password_reset: boolean
  auth_user_created: boolean
}

async function createAuthUsersForProfiles() {
  console.log('🔐 Creating Supabase Auth users for migrated profiles...')
  
  // Get all profiles that need auth users created
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_created', false)
    .not('email', 'is', null)
  
  if (fetchError) {
    console.error('Error fetching profiles:', fetchError)
    return
  }
  
  console.log(`Found ${profiles?.length || 0} profiles that need auth users`)
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found that need auth users')
    return
  }
  
  let successCount = 0
  let errorCount = 0
  
  for (const profile of profiles) {
    try {
      console.log(`Creating auth user for: ${profile.email}`)
      
      // Generate a temporary password
      const tempPassword = crypto.randomBytes(16).toString('hex')
      
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: profile.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          username: profile.username,
          display_name: profile.display_name,
          wordpress_user_id: profile.wordpress_user_id,
        }
      })
      
      if (authError) {
        console.error(`❌ Failed to create auth user for ${profile.email}:`, authError.message)
        errorCount++
        continue
      }
      
      // Update the profile to link it to the auth user and mark as created
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          auth_user_created: true,
          // Note: We're not updating the ID because it's already set
          // The profile ID and auth user ID should match for proper linking
        })
        .eq('id', profile.id)
      
      if (updateError) {
        console.error(`❌ Failed to update profile for ${profile.email}:`, updateError.message)
        errorCount++
        continue
      }
      
      console.log(`✅ Created auth user for: ${profile.email}`)
      successCount++
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`❌ Error processing ${profile.email}:`, error)
      errorCount++
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`✅ Successfully created: ${successCount} auth users`)
  console.log(`❌ Failed: ${errorCount} auth users`)
  console.log(`📝 Note: All users need to reset their passwords on first login`)
}

// Run the script
createAuthUsersForProfiles()
  .then(() => {
    console.log('\n🎉 Auth user creation completed!')
    console.log('📊 Check your Supabase Studio at: http://127.0.0.1:54323')
  })
  .catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
