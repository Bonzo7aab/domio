#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.+)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('🗺️  Populating database with 6 Ursynów jobs...\n');

async function populateJobs() {
  // Read and execute the SQL migration
  const sqlPath = path.join(__dirname, 'database', '11_populate_ursynow_jobs.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  console.log('📝 Running SQL migration: 11_populate_ursynow_jobs.sql\n');
  
  // Note: Supabase client doesn't support running raw DDL directly
  // We need to use the Supabase SQL editor or create via API
  
  console.log('⚠️  This script requires running the SQL via Supabase Dashboard:\n');
  console.log('1. Go to: https://fabbgaqxsetnsppxegnx.supabase.co/project/_/sql');
  console.log('2. Copy the contents of: database/11_populate_ursynow_jobs.sql');
  console.log('3. Paste and run in SQL Editor');
  console.log('4. Refresh your app to see database jobs\n');
  
  console.log('Or copy this SQL directly:\n');
  console.log('─'.repeat(60));
  console.log(sql);
  console.log('─'.repeat(60));
}

populateJobs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌', err.message);
    process.exit(1);
  });
