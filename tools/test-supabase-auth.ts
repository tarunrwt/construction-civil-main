import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function run() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment');
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const testEmail = process.env.TEST_SUPABASE_EMAIL || `test+${Date.now()}@example.com`;
  const testPassword = 'Test1234!';

  console.log('Using test email:', testEmail);

  // 1) Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: testEmail, password: testPassword });
  if (signUpError) console.error('signUpError', signUpError.message);
  else console.log('signUpData', { user: !!signUpData.user, status: signUpData });

  // 2) Try signIn (should fail until confirmed depending on settings)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: testEmail, password: testPassword });
  if (signInError) console.error('signInError', signInError.message);
  else console.log('signInData', signInData);

  // 3) Resend confirmation (if supported)
  // Note: supabase-js might not have a dedicated resend method; this is a minimal attempt using signUp options if available
  try {
    // Try calling the REST endpoint directly via supabase client
    const res = await fetch(`${url}/auth/v1/admin/otp/send`, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail, type: 'signup' }) });
    console.log('resend status', res.status);
  } catch (err) {
    console.error('resend error', err);
  }

  // 4) Initiate reset password
  const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, { redirectTo: `${process.env.APP_URL || 'http://localhost:8082'}/reset-password` });
  if (resetError) console.error('resetError', resetError.message);
  else console.log('resetData', resetData);
}

run().catch((e) => { console.error(e); process.exit(1); });