import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // This endpoint will confirm a user's email using the admin API
    // This should only be used in special circumstances and protected appropriately in production
    const { data, error } = await supabase.auth.admin.updateUserById(
      email, // ID or email of the user
      { email_confirm: true }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmed successfully',
    });
  } catch (error: any) {
    console.error('Error confirming email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
