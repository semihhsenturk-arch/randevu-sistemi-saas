-- Add whatsapp_status column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS whatsapp_status text CHECK (whatsapp_status IN ('sent', 'confirmed', 'declined'));

-- Optional: Create an index to quickly find appointments by status or time
CREATE INDEX IF NOT EXISTS idx_appointments_whatsapp_status ON public.appointments(whatsapp_status);

COMMENT ON COLUMN public.appointments.whatsapp_status IS 'Tracks the state of automated WhatsApp reminders: sent, confirmed (Evet), declined (Hayir)';
