CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  model TEXT NOT NULL,
  temperature NUMERIC(3,2) DEFAULT 0.3,
  timeout INTEGER DEFAULT 30000,
  max_tokens INTEGER DEFAULT 2048,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  last_used TIMESTAMPTZ,
  rate_limited_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  provider TEXT NOT NULL,
  api_key_id TEXT,
  model TEXT,
  response_time INTEGER,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  success BOOLEAN DEFAULT true,
  error TEXT,
  failover_from TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_providers" ON ai_providers FOR ALL USING (true);
CREATE POLICY "Admins can manage ai_api_keys" ON ai_api_keys FOR ALL USING (true);
CREATE POLICY "Admins can view ai_logs" ON ai_logs FOR SELECT USING (true);
