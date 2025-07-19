import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const status = req.query.status as string | undefined;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('payments')
    .select('*, user(*), receipt(*)', { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range(from, to);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }

  return res.status(200).json({
    payments: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: count ? Math.ceil(count / limit) : 1,
    },
  });
} 