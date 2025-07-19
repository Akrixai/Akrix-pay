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

  // Total payments
  const { count: totalPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true });

  // Successful payments
  const { count: successfulPayments } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Total receipts
  const { count: totalReceipts } = await supabase
    .from('receipts')
    .select('*', { count: 'exact', head: true });

  // Total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Total revenue
  const { data: revenueData } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed');
  const totalRevenue = revenueData ? revenueData.reduce((sum, p) => sum + (p.amount || 0), 0) : 0;

  // Recent payments
  const { data: recentPayments } = await supabase
    .from('payments')
    .select('*, user(*)')
    .order('createdAt', { ascending: false })
    .limit(5);

  // Monthly stats (group by month/year)
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount, createdAt')
    .eq('status', 'completed');
  const monthlyStats: Record<string, { count: number; revenue: number }> = {};
  if (allPayments) {
    allPayments.forEach((p) => {
      const date = new Date(p.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyStats[key]) monthlyStats[key] = { count: 0, revenue: 0 };
      monthlyStats[key].count += 1;
      monthlyStats[key].revenue += p.amount || 0;
    });
  }

  return res.status(200).json({
    overview: {
      totalPayments: totalPayments || 0,
      successfulPayments: successfulPayments || 0,
      totalReceipts: totalReceipts || 0,
      totalUsers: totalUsers || 0,
      totalRevenue,
      successRate: totalPayments ? (successfulPayments / totalPayments) * 100 : 0,
    },
    recentPayments: recentPayments || [],
    monthlyStats,
  });
} 