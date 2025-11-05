import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotificationToUser, initializeVAPID, type PushNotificationPayload } from '@/lib/push-notifications/server';
import webpush from 'web-push';

/**
 * API route for sending push notifications
 * This is primarily for testing purposes
 * 
 * POST /api/notifications/push
 * Body: {
 *   userId: string,
 *   title: string,
 *   body: string,
 *   icon?: string,
 *   url?: string,
 *   data?: Record<string, any>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize VAPID keys
    try {
      initializeVAPID();
    } catch (error) {
      return NextResponse.json(
        { error: 'VAPID keys not configured. Please set VAPID_PRIVATE_KEY and NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, title, body: message, icon, url, data } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, body' },
        { status: 400 }
      );
    }

    // Verify user exists
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Send push notification
    const payload: PushNotificationPayload = {
      title,
      body: message,
      icon: icon || '/logo.svg',
      badge: '/logo.svg',
      url: url || '/',
      data: data || {},
      timestamp: Date.now()
    };

    const result = await sendPushNotificationToUser(userId, payload);

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors.map(e => ({
        subscriptionId: e.subscriptionId,
        error: e.error.message
      }))
    });
  } catch (error) {
    console.error('Error in push notification API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/push
 * Test endpoint to check if push notifications are configured
 */
export async function GET() {
  try {
    initializeVAPID();
    const vapidDetails = webpush.getVapidDetails();
    
    return NextResponse.json({
      configured: !!vapidDetails.publicKey,
      hasPublicKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      hasPrivateKey: !!process.env.VAPID_PRIVATE_KEY
    });
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

