import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: appointments, error: apptError } = await supabase.from('appointments').select('*');
    if (apptError) throw apptError;

    const { data: profiles, error: profError } = await supabase.from('patient_profiles').select('*');
    if (profError) throw profError;

    const sortedApts = appointments
      .filter((a: any) => a.durum !== 'iptal')
      .sort((a: any, b: any) => {
        const dComp = (a.tarih || '').localeCompare(b.tarih || '');
        if (dComp !== 0) return dComp;
        return (a.saat || '').localeCompare(b.saat || '');
      });

    const userApts = new Map<string, any[]>();
    sortedApts.forEach(a => {
        if (!userApts.has(a.user_id)) userApts.set(a.user_id, []);
        userApts.get(a.user_id)!.push(a);
    });

    const aptTxMap = new Map<string, string>();
    
    for (const [userId, apts] of userApts.entries()) {
        apts.forEach((a: any, idx: number) => {
            const txNo = `#ISL-${(idx + 1).toString().padStart(4, '0')}`;
            aptTxMap.set(a.id, txNo);
        });
    }

    const updates = [];
    const debugLogs = [];

    for (const profile of profiles) {
      if (!profile.patient_name) continue;

      let changed = false;
      const txReplacements = new Map<string, string>();

      if (profile.face_treatments && profile.face_treatments.length > 0) {
        for (let i = 0; i < profile.face_treatments.length; i++) {
          const t = profile.face_treatments[i];
          if (t.isControl) continue;
          
          const tDateStr = t.date ? t.date.split(' ')[0] : '';
          const [d, m, y] = tDateStr.split('.');
          const normalizedTreatmentDate = y && m && d ? `${y}-${m}-${d}` : tDateStr;

          const uApts = userApts.get(profile.user_id) || [];
          let matchedApts = uApts.filter((a: any) => 
            a.musteri_adi && 
            a.musteri_adi.trim().toLowerCase() === profile.patient_name.trim().toLowerCase() && 
            a.tarih === normalizedTreatmentDate
          );
          
          if (matchedApts.length === 0) {
             // Fallback: match ANY appointment for this patient
             matchedApts = uApts.filter((a: any) => 
                a.musteri_adi && 
                a.musteri_adi.trim().toLowerCase() === profile.patient_name.trim().toLowerCase()
             );
          }
          
          if (matchedApts.length > 0) {
            const apt = matchedApts[0];
            const newTxNo = aptTxMap.get(apt.id);
            if (newTxNo && t.transactionNo !== newTxNo) {
              if (t.transactionNo) {
                txReplacements.set(t.transactionNo, newTxNo);
              }
              t.transactionNo = newTxNo;
              changed = true;
            }
          }
        }
      }

      if (profile.stock_history && profile.stock_history.length > 0) {
        for (let i = 0; i < profile.stock_history.length; i++) {
          const sh = profile.stock_history[i];
          
          if (sh.transaction_no && txReplacements.has(sh.transaction_no)) {
            sh.transaction_no = txReplacements.get(sh.transaction_no);
            changed = true;
            continue;
          }

          const shDateStr = sh.treatment_date ? sh.treatment_date.split(' ')[0] : (sh.date ? sh.date.split(' ')[0] : '');
          const [d, m, y] = shDateStr.split('.');
          const normalizedStockDate = y && m && d ? `${y}-${m}-${d}` : shDateStr;
          
          const uApts = userApts.get(profile.user_id) || [];
          let matchedApts = uApts.filter((a: any) => 
            a.musteri_adi && 
            a.musteri_adi.trim().toLowerCase() === profile.patient_name.trim().toLowerCase() && 
            a.tarih === normalizedStockDate
          );

          if (matchedApts.length === 0) {
             matchedApts = uApts.filter((a: any) => 
                a.musteri_adi && 
                a.musteri_adi.trim().toLowerCase() === profile.patient_name.trim().toLowerCase()
             );
          }
          
          if (matchedApts.length > 0) {
            const apt = matchedApts[0];
            const newTxNo = aptTxMap.get(apt.id);
            if (newTxNo && sh.transaction_no !== newTxNo) {
              sh.transaction_no = newTxNo;
              changed = true;
            }
          }
        }
      }
      
      if (profile.face_treatments && profile.face_treatments.length > 0) {
        for (let i = 0; i < profile.face_treatments.length; i++) {
          const t = profile.face_treatments[i];
          if (t.isControl && t.parentTransactionNo) {
            if (txReplacements.has(t.parentTransactionNo)) {
              t.parentTransactionNo = txReplacements.get(t.parentTransactionNo);
              changed = true;
            }
          }
        }
      }

      if (changed) {
        updates.push({
          id: profile.id,
          patient_name: profile.patient_name,
          face_treatments: profile.face_treatments,
          stock_history: profile.stock_history,
          txReplacements: Object.fromEntries(txReplacements)
        });
      }
    }

    for (const u of updates) {
      await supabase.from('patient_profiles').update({
        face_treatments: u.face_treatments,
        stock_history: u.stock_history
      }).eq('id', u.id);
    }

    return NextResponse.json({ success: true, updatedCount: updates.length, updates, debugLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
