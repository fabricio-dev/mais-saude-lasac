DATABASE_URL=""
BETTER_AUTH_SECRET="00000"
BETTER_AUTH_URL=https://suaurl.com

GOOGLE_CLIENT_ID="xxxxxxxxxxx5onsa.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxx"

# WhatsApp Business API (Meta) Configuration

WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_ACCESS_TOKEN=seu_token_de_acesso_permanente
WHATSAPP_PHONE_NUMBER_ID=seu_phone_number_id
NEXT_PUBLIC_APP_URL=https://seudominio.com.br
WHATSAPP_ENV=dev
WHATSAPP_TEST_PHONE=kkkkkkkkkkk

# Número oficial do WhatsApp para aparecer nos templates de lembrete

# Formato: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX

WHATSAPP_OFFICIAL_NUMBER=(11) 91234-5678

# Cron Job Security

# Gerar com: openssl rand -base64 32

CRON_SECRET=seu_token_secreto_aleatorio_para_proteger_cron
