# Guia de Configuração do Cron na VPS

Este guia explica como configurar o cron job de lembretes WhatsApp em uma VPS com cron tradicional do Linux/Unix.

## 📋 Pré-requisitos

- VPS com acesso SSH
- Node.js instalado (versão 18 ou superior)
- PostgreSQL acessível da VPS
- Projeto Next.js buildado ou em modo de produção

## 🚀 Passo a Passo

### 1. Preparar o Projeto na VPS

```bash
# Conectar na VPS
ssh user@seu-servidor.com

# Navegar para o diretório do projeto
cd /caminho/para/mais-saude-lasac

# Instalar dependências
npm install

# Copiar e configurar .env
cp .env.example .env
nano .env
```

### 2. Configurar Variáveis de Ambiente

Editar o arquivo `.env` com as credenciais corretas:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_ENV=prod
WHATSAPP_AI_URL=https://atendimento.seu-dominio.com
WHATSAPP_AI_API_KEY=wai_chave_gerada_no_whatsapp_ai
WHATSAPP_OFFICIAL_NUMBER=5587991372728

# Outros
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://seu-dominio.com
```

### 3. Configurar o Script de Execução

```bash
# Tornar o script executável
chmod +x run-cron.sh

# Editar o script para ajustar o caminho do projeto
nano run-cron.sh
```

Ajustar esta linha no `run-cron.sh`:
```bash
PROJECT_DIR="/caminho/para/mais-saude-lasac"
```

### 4. Testar Manualmente

```bash
# Executar o script manualmente para testar
./run-cron.sh

# Ou diretamente com npx tsx
npx tsx src/cron/whatsapp-renewal-cron.ts
```

Verificar se:
- ✅ Conecta no banco de dados
- ✅ Busca pacientes elegíveis
- ✅ Envia mensagens (se houver pacientes)
- ✅ Não há erros

### 5. Configurar o Cron Job

```bash
# Abrir o crontab
crontab -e
```

Adicionar a linha (executar todo dia às 9h):

```cron
# Lembretes de renovação WhatsApp - Todo dia às 9h
0 9 * * * /caminho/para/mais-saude-lasac/run-cron.sh
```

**Outros horários:**

```cron
# Todo dia às 9h
0 9 * * * /caminho/para/run-cron.sh

# Todo dia às 9h e 15h
0 9,15 * * * /caminho/para/run-cron.sh

# Segunda a sexta às 9h
0 9 * * 1-5 /caminho/para/run-cron.sh

# A cada 6 horas
0 */6 * * * /caminho/para/run-cron.sh
```

### 6. Verificar o Cron

```bash
# Listar cron jobs ativos
crontab -l

# Ver logs do sistema
tail -f /var/log/syslog | grep CRON
# ou
tail -f /var/log/cron

# Ver logs do projeto
tail -f /caminho/para/mais-saude-lasac/logs/cron-whatsapp.log
```

## 📊 Estrutura de Logs

O script cria logs em `logs/cron-whatsapp.log`:

```
========================================
Executando cron em: 2024-12-22 09:00:01
========================================

╔════════════════════════════════════════════════════════╗
║     CRON: Lembretes de Renovação via WhatsApp         ║
╚════════════════════════════════════════════════════════╝
Executado em: 22/12/2024 09:00:01 (SP)
Timezone: America/Sao_Paulo (UTC-3)
⚠️  Datas no banco estão em UTC, convertendo automaticamente

[D-7] Buscando pacientes...
[RENEWAL_D_7] 3 pacientes elegíveis encontrados
...

Código de saída: 0
```

## 🔧 Troubleshooting

### Cron não executa

1. **Verificar permissões:**
   ```bash
   chmod +x run-cron.sh
   ls -l run-cron.sh
   ```

2. **Verificar PATH do Node:**
   ```bash
   which node
   which npm
   which npx
   ```

3. **Testar manualmente:**
   ```bash
   /caminho/completo/para/run-cron.sh
   ```

4. **Ver logs do cron do sistema:**
   ```bash
   grep CRON /var/log/syslog
   ```

### Erro de módulos não encontrados

```bash
# Instalar tsx globalmente
npm install -g tsx

# Ou usar localmente
npx tsx src/cron/whatsapp-renewal-cron.ts
```

### Erro de permissão no diretório de logs

```bash
# Criar diretório manualmente
mkdir -p logs
chmod 755 logs
```

### Erro de conexão com banco

Verificar se o PostgreSQL está acessível:
```bash
psql $DATABASE_URL -c "SELECT 1"
```

## 📧 Notificação de Erros (Opcional)

Para receber email quando o cron falhar:

```bash
# Instalar mailutils
sudo apt-get install mailutils

# Configurar MAILTO no crontab
crontab -e
```

Adicionar no topo:
```cron
MAILTO=seu-email@example.com

0 9 * * * /caminho/para/run-cron.sh
```

## 🔄 Rotação de Logs

O script `run-cron.sh` já faz rotação automática quando o log ultrapassa 10MB.

Para rotação manual:
```bash
cd /caminho/para/mais-saude-lasac
mv logs/cron-whatsapp.log logs/cron-whatsapp.log.old
touch logs/cron-whatsapp.log
```

## 📱 Monitoramento

### Via Logs
```bash
# Ver logs em tempo real
tail -f logs/cron-whatsapp.log

# Ver últimas execuções
tail -n 100 logs/cron-whatsapp.log

# Buscar erros
grep -i error logs/cron-whatsapp.log
```

### Via Banco de Dados
```sql
-- Ver notificações enviadas hoje
SELECT 
  p.name,
  wn.notification_type,
  wn.status,
  wn.sent_at
FROM whatsapp_notifications wn
JOIN patients p ON wn.patient_id = p.id
WHERE DATE(wn.sent_at) = CURRENT_DATE;

-- Ver estatísticas gerais
SELECT 
  notification_type,
  status,
  COUNT(*) as total
FROM whatsapp_notifications
GROUP BY notification_type, status;
```

## 🔐 Segurança

1. **Proteger o arquivo .env:**
   ```bash
   chmod 600 .env
   ```

2. **Não commitar credenciais:**
   - Adicionar `.env` ao `.gitignore`

3. **Usar usuário sem privilégios root:**
   ```bash
   # Criar usuário específico para o cron
   sudo useradd -m cronuser
   sudo -u cronuser crontab -e
   ```

## ✅ Checklist Final

- [ ] Node.js instalado e funcionando
- [ ] Projeto clonado e dependências instaladas
- [ ] `.env` configurado com credenciais corretas
- [ ] Script `run-cron.sh` com caminho correto
- [ ] Permissões de execução configuradas (`chmod +x`)
- [ ] Teste manual executado com sucesso
- [ ] Cron job adicionado ao crontab
- [ ] Logs sendo gerados corretamente
- [ ] Templates aprovados na Meta
- [ ] Monitoramento configurado

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs: `tail -f logs/cron-whatsapp.log`
2. Testar manualmente: `./run-cron.sh`
3. Verificar cron do sistema: `grep CRON /var/log/syslog`
4. Validar conexão com banco: `psql $DATABASE_URL -c "SELECT 1"`

---

**Última atualização:** 22/12/2024


