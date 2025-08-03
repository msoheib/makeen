// Test script to check if owner profiles can be fetched
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testOwnerProfiles() {
  console.log('Testing owner profiles fetch...');
  
  try {
    // Test direct query to profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'owner')
      .eq('status', 'active');
    
    if (error) {
      console.error('Error fetching owner profiles:', error);
      return;
    }
    
    console.log('Owner profiles found:', data?.length || 0);
    console.log('Profiles:', data?.map(p => ({ 
      id: p.id, 
      name: `${p.first_name} ${p.last_name}`,
      email: p.email 
    })));
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testOwnerProfiles();