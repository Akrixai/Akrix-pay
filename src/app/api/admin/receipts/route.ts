import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('receipts')
      .select('*, payment(*, user(*))', { count: 'exact' })
      .order('generatedAt', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`receiptNumber.ilike.%${search}%,payment.user.name.ilike.%${search}%,payment.user.email.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Database error', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      receipts: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: count ? Math.ceil(count / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { success: false, message: 'Server error', error: error.message },
      { status: 500 }
    );
  }
}