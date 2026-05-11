import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Format expected for simulator: { appointmentId: string, reply: 'Evet' | 'Hayır' }
    // In real Twilio/Meta, you'd parse from `body.Entry[0].changes[0].value.messages[0]`
    const { appointmentId, reply } = body;
    
    if (!appointmentId || !reply) {
      return NextResponse.json({ success: false, error: 'Missing appointmentId or reply' }, { status: 400 });
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
