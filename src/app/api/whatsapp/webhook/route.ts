import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success, limit, remaining, reset } = checkRateLimit(`whatsapp-webhook:${ip}`, 100, 60000); // 100 reqs/min per IP
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString()
          }
        }
      );
    }

    // Webhook güvenlik kontrolü: X-Webhook-Secret başlığını doğrula
    const webhookSecret = req.headers.get('X-Webhook-Secret');
    const expectedSecret = process.env.WHATSAPP_WEBHOOK_SECRET;
    
    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.warn('Yetkisiz webhook isteği denemesi');
      return NextResponse.json({ success: false, error: 'Unauthorized webhook request' }, { status: 401 });
    }

    const body = await req.json();
    
    // Format expected for simulator: { appointmentId: string, reply: 'Evet' | 'Hayır', userId: string }
    // In real Twilio/Meta, you'd parse from `body.Entry[0].changes[0].value.messages[0]`
    const { appointmentId, reply, userId } = body;
    
    // SEC-06 FIX: userId is now required to ensure tenant isolation
    if (!appointmentId || !reply || !userId) {
      return NextResponse.json({ success: false, error: 'Missing appointmentId, reply, or userId' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();
      
    if (fetchError || !appointment) {
      return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });
    }

    // SEC-06 FIX: Verify that the appointment belongs to the tenant who is receiving the webhook
    if (appointment.user_id !== userId) {
      console.error(`Webhook tenant mismatch: appointment ${appointmentId} belongs to ${appointment.user_id}, but webhook claimed ${userId}`);
      return NextResponse.json({ success: false, error: 'Unauthorized tenant for this appointment' }, { status: 403 });
    }

    let updatedDurum = appointment.durum;
    let newStatus = 'sent';
    
    if (reply.toLowerCase() === 'evet') {
      updatedDurum = 'onaylandi';
      newStatus = 'confirmed';
    } else if (reply.toLowerCase() === 'hayır' || reply.toLowerCase() === 'hayir') {
      // User says they stay in waiting room, so durum stays 'beklemede', but status goes to 'declined'
      updatedDurum = 'beklemede';
      newStatus = 'declined';
    }

    const { error: updateError } = await supabaseAdmin
      .from('appointments')
      .update({ durum: updatedDurum, whatsapp_status: newStatus })
      .eq('id', appointmentId);
      
    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Processed reply '${reply}'` });
    
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
