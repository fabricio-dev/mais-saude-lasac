-- Remove o consentimento de WhatsApp dos pacientes com telefone placeholder
-- "(00) 00000-0000". A comparação é feita só pelos dígitos, então também pega
-- variações como "00000000000" ou "(00) 0000-0000".

-- 1. Conferir quem será afetado
SELECT id, name, phone_number, whatsapp_consent
FROM patients
WHERE regexp_replace(phone_number, '\D', '', 'g') ~ '^0+$'
  AND whatsapp_consent = true;

-- 2. Aplicar a alteração (rode em transação e confira o total antes do COMMIT)
BEGIN;

UPDATE patients
SET whatsapp_consent = false,
    updated_at = now()
WHERE regexp_replace(phone_number, '\D', '', 'g') ~ '^0+$'
  AND whatsapp_consent = true;

-- COMMIT;   -- se o número de linhas bater com a consulta acima
-- ROLLBACK; -- caso contrário
