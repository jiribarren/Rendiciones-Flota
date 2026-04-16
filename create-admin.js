import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

// Load env
const envFile = fs.readFileSync('.env.local', 'utf8')
const env: Record<string, string> = {}
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=')
    env[key.trim()] = value.trim()
  }
})

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createAdminUser() {
  console.log('Creating admin user...')
  
  // Try to sign up - but this will fail if email is already taken
  // Since Supabase has email confirmation enabled by default, we need to handle that
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@rendiciones.cl',
    email_confirm: true,
    password: 'AdminRendiciones2024!',
    user_metadata: {
      full_name: 'Administrador',
      role: 'admin'
    }
  })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  console.log('Admin user created!')
  console.log('Email: admin@rendiciones.cl')
  console.log('Password: AdminRendiciones2024!')
}

createAdminUser()