import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseISO, differenceInMinutes } from 'date-fns';

export async function GET(req: Request) {
  // This endpoint should be triggered periodically (e.g. via Vercel Cron or Simulator)
  
  // Allow overriding the 24h check via a query param for testing purposes
  const url = new URL(req.url);
  const forceAll = url.searchParams.get('forceAll') === 'true';
  
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch all 'beklemede' appointments without a whatsapp_status
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('durum', 'beklemede')
      .is('whatsapp_status', null);
      
    if (error) throw error;
    
    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ success: true, message: 'No pending appointments found.', sent: 0 });
    }

    const now = new Date();
    const sentIds = [];

    // 2. Check each appointment to see if it is ~24 hours from now
    for (const apt of appointments) {
      if (!apt.tarih || !apt.saat) continue;
      
      const aptDateTimeStr = `${apt.tarih}T${apt.saat}:00`;
      const aptDate = parseISO(aptDateTimeStr);
      
      // Calculate how many minutes until the appointment
      const diffMins = differenceInMinutes(aptDate, now);
      
      // If it is exactly 24 hours away (e.g. between 23.5 and 24.5 hours) or forceAll is true
      // 24 hours = 1440 minutes. Trigger if between 1410 and 1470 minutes.
      if (forceAll || (diffMins > 1410 && diffMins <= 1470)) {
        // Here we would call the real Twilio/Meta API.
        // For the simulator, we just update the DB status to 'sent'
        console.log(`[WhatsApp API] Sending reminder to ${apt.telefon} for appointment ${apt.id}`);
        
        const { error: updateError } = await supabaseAdmin
          .from('appointments')
          .update({ whatsapp_status: 'sent' })
          .eq('id', apt.id);
          
        if (!updateError) {
          sentIds.push(apt.id);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${appointments.length} pending appointments. Sent ${sentIds.length} reminders.`,
      sentIds
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
