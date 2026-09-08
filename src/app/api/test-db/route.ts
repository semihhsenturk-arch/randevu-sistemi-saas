import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { decryptPatientProfilesBatch } from '@/actions/secure-data';

export async function GET(request: Request) {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase.from('patient_profiles').select('*').limit(2);
    
    if (error) {
      return NextResponse.json({ status: 'error', message: 'DB fetch failed', details: error.message }, { status: 500 });
    }
    
    const decrypted = await decryptPatientProfilesBatch(data);
    
    return NextResponse.json({ status: 'success', data: decrypted });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: 'Action failed', details: error.message, stack: error.stack }, { status: 500 });
  }
}
