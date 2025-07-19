import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  // Find admin by username or email
  const { data: admins, error } = await supabase
    .from('admins')
    .select('*')
    .or(`username.eq.${username},email.eq.${username}`)
    .limit(1);

  if (error) {
    return res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }

  const admin = admins && admins[0];
  if (!admin || !admin.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Return admin info (no password)
  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    token: `admin-${admin.id}`,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
} 