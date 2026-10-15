DATABASE_URL=""
BETTER_AUTH_SECRET="00000"
BETTER_AUTH_URL=https://suaurl.com

GOOGLE_CLIENT_ID="xxxxxxxxxxx5onsa.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxx"

# WhatsApp — enviado pelo sistema de atendimento (whatsapp-ai), no mesmo número

# WHATSAPP_ENABLED, WHATSAPP_D0_LATE_ENABLED, WHATSAPP_D30_DAILY_LIMIT e

# WHATSAPP_OFFICIAL_NUMBER são só o valor inicial: depois que a tela /whatsapp

# for salva, valem os valores dela.

WHATSAPP_ENABLED=true

# Endereço do whatsapp-ai, sem barra no fim

WHATSAPP_AI_URL=https://atendimento.seudominio.com.br

# Chave gerada em whatsapp-ai → Configurações → Integrações → Envio pelo seu sistema

WHATSAPP_AI_API_KEY=wai_xxxxxxxxxxxxxxxxxxxxxxxx

# Lembretes do cron

# Aviso "venceu em {{data}}" para quem perdeu o D0 — ligar só depois de o template

# lembrete_vencimento_atrasado estar aprovado na Meta

WHATSAPP_D0_LATE_ENABLED=false

# Máximo de avisos D+30 por execução (o acúmulo drena ao longo dos dias)

WHATSAPP_D30_DAILY_LIMIT=100
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
WHATSAPP_ENV=dev
WHATSAPP_TEST_PHONE=kkkkkkkkkkk

# Número oficial do WhatsApp para aparecer nos templates de lembrete

# Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX

WHATSAPP_OFFICIAL_NUMBER=(11) 91234-5678

# Cron Job Security

# Gerar com: openssl rand -base64 32

CRON_SECRET=seu_token_secreto_aleatorio_para_proteger_cron

# Integração com o sistema de atendimento (whatsapp-ai)

# Chave do header X-Api-Key da rota /api/integrations/v1/patient-lookup

# Gerar com: openssl rand -hex 32

INTEGRATION_API_KEY=chave_da_integracao_com_o_atendimento
