// Test Supabase connection
import { createClient } from '@supabase/supabase-js'

// Replace these with your actual values
const supabaseUrl = 'YOUR_PROJECT_URL_HERE'
const supabaseKey = 'YOUR_ANON_KEY_HERE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    console.log('Key present:', !!supabaseKey)
    
    // Test basic connection by trying to read from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      console.error('Error details:', error)
    } else {
      console.log('✅ Connection successful!')
      console.log('✅ Profiles table accessible')
      console.log('Data returned:', data)
    }
  } catch (err) {
    console.error('❌ Test failed with exception:', err.message)
  }
}

testConnection()

