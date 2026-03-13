
-- Knowledge base documents table for RAG
CREATE TABLE public.kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'sop',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow all authenticated users to read
ALTER TABLE public.kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read KB docs"
  ON public.kb_documents FOR SELECT
  TO authenticated
  USING (true);

-- Add compliance_data column to transcriptions
ALTER TABLE public.transcriptions ADD COLUMN compliance_data JSONB DEFAULT NULL;

-- Seed the hard-coded compliance rules
INSERT INTO public.kb_documents (rule, content, source) VALUES
('Mandatory greeting — agent name + issue acknowledgement', 'Every interaction must begin with agent''s first name, acknowledgment of the issue, and expression of willingness to help. Non-compliant openings score 1 on Compliance.', 'sop'),
('Empathy — required phrase in each interaction', 'At least one empathy phrase required: ''I completely understand how frustrating this must be'', ''I''m sorry for the inconvenience'', ''Thank you for your patience''.', 'sop'),
('Escalated emotions — acknowledge before solving', 'When customer says ''furious'', ''unacceptable'', ''ridiculous'', or ''I want to cancel'', agent MUST acknowledge the emotion FIRST before any solution. Violation = Empathy Score 1.', 'sop'),
('2FA reset — backup email verification mandatory', 'Before resetting 2FA, agent MUST verify via backup email on file ONLY. Resetting without this = Critical Compliance Breach (Score 1). No exceptions.', 'sop'),
('Refund — confirm 14-day eligibility before promising', 'Refunds only within 14 calendar days of charge. Agent must NOT promise refund before confirming eligibility. >$200 needs manager approval; >$500 escalate to Billing Manager.', 'sop'),
('GDPR / DSAR — escalate to Compliance team only', 'Agent CANNOT process DSAR independently. Must escalate, log with timestamp, inform customer of 30-day SLA. Do NOT share any user data in chat.', 'sop'),
('Cancellation — must offer Pause before processing', 'Before cancelling, agent MUST ask reason and offer Pause feature (up to 3 months at 50% cost). Skipping this offer is a Compliance Violation.', 'sop'),
('Closing — resolution confirmation + anything else required', 'Must confirm issue resolved, ask ''Is there anything else I can help you with today?'', thank customer by name. Missing = Score 2.', 'sop'),
('Prohibited phrases', 'NEVER say: ''That''s not my department'', ''I don''t know'', ''You should have read the terms'', ''There''s nothing I can do'', ''Calm down''.', 'sop'),
('SSO/SAML failures — log as minimum P2 ticket', 'All SSO/SAML failures must be ticketed at minimum P2. Do NOT share internal IdP credentials or authentication URLs.', 'sop'),
('Ticket SLA — must communicate priority + response time', 'All escalations: give customer the ticket number, priority (P1/P2/P3/P4) and SLA: P1=4hr, P2=24hr, P3=48hr, P4=72hr.', 'sop'),
('IP Whitelisting — Admin role + written confirmation required', 'Verify requester has Admin role. Require written confirmation (in-chat or email) before adding any IP addresses.', 'sop');
