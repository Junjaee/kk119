const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

console.log('🔍 Checking Supabase configuration...');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  try {
    console.log('\n📋 Fetching all users from Supabase...');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`\n✅ Found ${data.length} users:`);
    data.forEach(user => {
      console.log(`\n- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Has password: ${!!user.password}`);
    });

    // Test finding a specific user
    if (data.length > 0) {
      const testEmail = data[0].email;
      console.log(`\n🔍 Testing findByEmail for: ${testEmail}`);

      const { data: foundUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (findError) {
        console.error('❌ Find error:', findError);
      } else {
        console.log('✅ User found:', {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name
        });
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkUsers();
