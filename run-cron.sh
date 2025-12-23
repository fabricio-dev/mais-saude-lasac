#!/bin/bash

# Script para executar o cron job de lembretes WhatsApp
# Este script deve ser chamado pelo cron do sistema

# Definir diretório do projeto
#PROJECT_DIR="/caminho/para/mais-saude-lasac"
PROJECT_DIR="C:/git/mais-saude-lasac"
# Ir para o diretório do projeto
cd "$PROJECT_DIR" || exit 1

# Carregar NVM se necessário (descomente se usar NVM)
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
# nvm use 20

# Definir PATH do Node (ajuste conforme sua instalação)
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Log file
LOG_FILE="$PROJECT_DIR/logs/cron-whatsapp.log"

# Criar diretório de logs se não existir
mkdir -p "$PROJECT_DIR/logs"

# Executar o cron e redirecionar output para o log
echo "========================================" >> "$LOG_FILE"
echo "Executando cron em: $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Executar usando tsx (TypeScript executor)
npx tsx src/cron/whatsapp-renewal-cron.ts >> "$LOG_FILE" 2>&1

# Capturar código de saída
EXIT_CODE=$?

echo "Código de saída: $EXIT_CODE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Rotacionar logs se ficarem muito grandes (> 10MB)
if [ -f "$LOG_FILE" ]; then
  LOG_SIZE=$(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null)
  if [ "$LOG_SIZE" -gt 10485760 ]; then
    mv "$LOG_FILE" "$LOG_FILE.old"
    echo "Log rotacionado em: $(date)" > "$LOG_FILE"
  fi
fi

exit $EXIT_CODE


