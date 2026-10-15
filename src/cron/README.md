# Cron Job - Lembretes de Renovação via WhatsApp

## Visão Geral

Sistema automatizado para envio de lembretes de renovação de convênio via WhatsApp Business API usando templates pré-aprovados pela Meta.

## Tipos de Lembrete

Cada lembrete olha uma **janela**, não um dia só: se o cron não rodar, ou se este
sistema ou o whatsapp-ai estiver fora do ar, a próxima execução recupera quem
ficou para trás. A trava `UNIQUE(patientId, notificationType)` garante um aviso
de cada tipo por ciclo.

### 1. RENEWAL_D_7 - Lembrete antes do vencimento
- **Quando**: vence entre amanhã (D-1) e daqui a 7 dias, sem ter recebido o D-7
- **Template**: `lembrete_vencimento_7_dias` (o texto leva a data, então vale em qualquer dia da janela)
- **Objetivo**: o aviso antecipado é o que mais converte em renovação
- **Status do paciente**: Ativo (`isActive = true`)

### 2. RENEWAL_D_0 - Lembrete no dia
- **Quando**: vence hoje. Só no dia — o texto diz "hoje"
- **Template**: `lembrete_vencimento_hoje`

### 3. RENEWAL_D_0_LATE - Recuperação do D0
- **Quando**: venceu há 1 a 29 dias sem ter recebido o D0 nem este
- **Template**: `lembrete_vencimento_atrasado` — parâmetros: nome, data de vencimento, número WhatsApp
- **Ligado por**: `WHATSAPP_D0_LATE_ENABLED=true`, depois de o template ser aprovado na Meta

### 4. RENEWAL_D_30 - Lembrete após vencimento
- **Quando**: venceu há 30 dias ou mais, sem ter recebido o D+30
- **Template**: `lembrete_vencimento_30_dias`
- **Teto**: `WHATSAPP_D30_DAILY_LIMIT` por execução (padrão 100), dos vencidos mais recentes para os mais antigos. O número é o mesmo do atendimento, com limite diário na Meta — o acúmulo da primeira execução drena ao longo de alguns dias
- **Status do paciente**: Pode estar inativo

### Falhas
- **Telefone inválido** (do cadastro ou recusado pelo whatsapp-ai): fica `failed`, com o motivo em `failure_reason`, e não é repetido — é do paciente, e voltaria a cada execução ocupando o teto do D+30
- **Pulado** (paciente descadastrado no atendimento): fica `failed` com o motivo — não recebeu, e repetir não muda nada
- **Todo o resto** (whatsapp-ai fora do ar, rede, template pausado na Meta, variáveis erradas, chave ou recurso desligado): a trava é desfeita e a próxima execução tenta de novo, dentro da janela. São falhas que atingem o lote inteiro e se resolvem com uma correção

### Telefone
O cadastro guarda DDD + número, sem o código do país, com ou sem o 9 do celular (`87 9xxxxxxxx` ou `87 xxxxxxxx`). O cron acrescenta o `55` pelo tamanho (10 ou 11 dígitos) e aceita as duas formas; o whatsapp-ai encontra a ficha do paciente com ou sem o 9.

## Regras de Negócio

### ✅ Critérios para Envio

1. **Consentimento obrigatório**
   - `whatsappConsent = true` (todos os lembretes são de Marketing)

2. **Envio único**
   - Cada lembrete é enviado apenas UMA VEZ por paciente
   - O banco usa `UNIQUE(patientId, notificationType)` como lock

3. **Telefone válido**
   - Validado por `isValidPhoneNumber()`
   - Formatado por `formatPhoneNumber()`

4. **Data de expiração válida**
   - Deve ter `expirationDate` preenchido

### 🔒 Proteção contra Duplicação

O sistema usa o banco de dados como lock:

```typescript
// 1. Tenta criar registro com status = 'pending'
INSERT INTO whatsapp_notifications (patientId, notificationType, ...)

// 2. Se falhar por UNIQUE constraint, pula (já foi enviado)
// 3. Se sucesso, continua com envio
// 4. Atualiza status para 'sent' ou 'failed'
```

**Garantia**: Mesmo se o cron rodar 2x ao mesmo tempo, cada paciente receberá apenas 1 lembrete de cada tipo.

### 🛡️ Proteção em Ambiente DEV

```env
WHATSAPP_ENV=dev
WHATSAPP_TEST_PHONE=5511999999999
```

Em ambiente `dev`, TODAS as mensagens são redirecionadas para `WHATSAPP_TEST_PHONE`.

## Templates do WhatsApp

Os templates abaixo devem estar **PRÉ-APROVADOS** no Meta Business Manager:

### lembrete_vencimento_7_dias
```
Mensagem automática do Sistema Mais Saude LASAC.

Olá, {{1}}. Este é um lembrete importante: seu cartão LASAC vence em {{2}}.

Para evitar a interrupção dos benefícios, realize a renovação dentro do prazo informado.

Para dúvidas ou atendimento, utilize o WhatsApp oficial:

👉 wa.me/{{3}} e fale com nossa equipe.
```

### lembrete_vencimento_hoje
```
Mensagem automática do Sistema LASAC.

Olá, {{1}}. Informamos que, na data de hoje, ocorre o vencimento do seu cartão LASAC.

Para continuar utilizando os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/{{2}} para receber suporte.
```

### lembrete_vencimento_30_dias
```
Mensagem automática do Sistema LASAC.

Olá, {{1}}. Identificamos que o seu cartão LASAC encontra-se vencido há mais de 30 dias.

Para retomar os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/{{2}} para receber suporte.
```

**Parâmetros:**

**D-7 (3 parâmetros):**
1. `{{1}}` - Primeiro nome do paciente
2. `{{2}}` - Data de expiração (formato DD/MM/YYYY)
3. `{{3}}` - Número oficial do WhatsApp (vem do .env: WHATSAPP_OFFICIAL_NUMBER)

**D0 e D+30 (2 parâmetros):**
1. `{{1}}` - Primeiro nome do paciente
2. `{{2}}` - Número oficial do WhatsApp (vem do .env: WHATSAPP_OFFICIAL_NUMBER)

⚠️ **Importante:** Os templates D0 e D+30 NÃO usam data de vencimento

## Como Usar

### 1. Configurar Variáveis de Ambiente

```env
# Habilitar WhatsApp
WHATSAPP_ENABLED=true

# Ambiente (dev ou prod)
WHATSAPP_ENV=prod

# Envio pelo whatsapp-ai (mesmo número do atendimento)
WHATSAPP_AI_URL=https://atendimento.seudominio.com.br
WHATSAPP_AI_API_KEY=wai_chave_gerada_no_whatsapp_ai

# Recuperação do D0 ("venceu em {{data}}"): ligar depois de aprovar o template
# lembrete_vencimento_atrasado na Meta
WHATSAPP_D0_LATE_ENABLED=false

# Teto de avisos D+30 por execução
WHATSAPP_D30_DAILY_LIMIT=100

# Telefone de teste (usado em dev)
WHATSAPP_TEST_PHONE=5511999999999
```

### 2. Executar Manualmente

```bash
# Usando ts-node
npx ts-node src/cron/whatsapp-renewal-cron.ts

# Ou importando no código
import { runWhatsAppRenewalCron } from '@/cron/whatsapp-renewal-cron';

await runWhatsAppRenewalCron();
```

### 3. Agendar com Vercel Cron

Criar arquivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/whatsapp-renewal",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Criar arquivo `app/api/cron/whatsapp-renewal/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { runWhatsAppRenewalCron } from '@/cron/whatsapp-renewal-cron';

export async function GET(request: Request) {
  // Validar token de segurança (opcional mas recomendado)
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await runWhatsAppRenewalCron();
    
    return NextResponse.json({ 
      success: true,
      message: 'Cron executado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao executar cron:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
```

### 4. Agendar com Node-Cron

```typescript
import cron from 'node-cron';
import { runWhatsAppRenewalCron } from '@/cron/whatsapp-renewal-cron';

// Executar todo dia às 9h
cron.schedule('0 9 * * *', async () => {
  console.log('Iniciando cron de lembretes WhatsApp');
  
  try {
    await runWhatsAppRenewalCron();
  } catch (error) {
    console.error('Erro no cron:', error);
  }
});
```

## Fluxo de Execução

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Buscar pacientes elegíveis (D-7, D0, D+30)              │
│    - Filtrar por data de expiração                         │
│    - Filtrar por whatsappConsent = true                    │
│    - LEFT JOIN para excluir já enviados                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Para cada paciente:                                      │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ a) Validar telefone                                 │ │
│    │    - formatPhoneNumber()                            │ │
│    │    - isValidPhoneNumber()                           │ │
│    └─────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ b) Obter template aprovado                          │ │
│    │    - getTemplateConfig()                            │ │
│    └─────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ c) Criar lock no banco                              │ │
│    │    - INSERT whatsapp_notifications (status=pending) │ │
│    │    - Se falhar por UNIQUE, pular                    │ │
│    └─────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ d) Aplicar proteção DEV                             │ │
│    │    - Redirecionar para WHATSAPP_TEST_PHONE          │ │
│    └─────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ e) Enviar via WhatsApp Cloud API                    │ │
│    │    - sendWhatsAppTemplate()                         │ │
│    └─────────────────────────────────────────────────────┘ │
│    ┌─────────────────────────────────────────────────────┐ │
│    │ f) Atualizar status no banco                        │ │
│    │    - sent + sentAt OU failed                        │ │
│    └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Exibir resumo                                            │
│    - Total processados                                      │
│    - Sucessos                                               │
│    - Falhas (com motivo)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Logs de Exemplo

```
╔════════════════════════════════════════════════════════╗
║     CRON: Lembretes de Renovação via WhatsApp         ║
╚════════════════════════════════════════════════════════╝
Executado em: 20/12/2024 09:00:00

========================================
[RENEWAL_D_7] Iniciando processamento
========================================

[D-7] Buscando pacientes com expirationDate entre 27/12/2024 e 27/12/2024
[RENEWAL_D_7] 5 pacientes elegíveis encontrados
[RENEWAL_D_7] Enviando lembrete para João Silva ((11) 9****-1234)
✅ Template WhatsApp "lembrete_renovacao_d7" enviado com sucesso para 5511999991234 - ID: wamid.xxx
[RENEWAL_D_7] Enviando lembrete para Maria Santos ((11) 9****-5678)
✅ Template WhatsApp "lembrete_renovacao_d7" enviado com sucesso para 5511999995678 - ID: wamid.yyy

[RENEWAL_D_7] ===== RESUMO =====
[RENEWAL_D_7] Total processados: 5
[RENEWAL_D_7] ✅ Sucesso: 5
[RENEWAL_D_7] ❌ Falhas: 0

========================================
[RENEWAL_D_0] Iniciando processamento
========================================

[D0] Buscando pacientes com expirationDate = 20/12/2024
[RENEWAL_D_0] Nenhum paciente elegível encontrado

========================================
[RENEWAL_D_30] Iniciando processamento
========================================

[D+30] Buscando pacientes com expirationDate = 20/11/2024
[RENEWAL_D_30] 2 pacientes elegíveis encontrados
...

╔════════════════════════════════════════════════════════╗
║            CRON FINALIZADO COM SUCESSO                ║
╚════════════════════════════════════════════════════════╝
Tempo total: 12.45s
```

## Monitoramento

### Consultar Notificações Enviadas

```sql
-- Ver todas as notificações de um paciente
SELECT * FROM whatsapp_notifications
WHERE patient_id = 'uuid-do-paciente'
ORDER BY created_at DESC;

-- Ver notificações por status
SELECT 
  notification_type,
  status,
  COUNT(*) as total
FROM whatsapp_notifications
GROUP BY notification_type, status;

-- Ver notificações enviadas hoje
SELECT 
  p.name,
  wn.notification_type,
  wn.status,
  wn.sent_at
FROM whatsapp_notifications wn
JOIN patients p ON wn.patient_id = p.id
WHERE DATE(wn.sent_at) = CURRENT_DATE
ORDER BY wn.sent_at DESC;
```

### Reenviar Notificações Falhadas

Para reenviar notificações que falharam, você precisa:

1. Investigar o motivo da falha nos logs
2. Corrigir o problema (telefone inválido, template, etc)
3. Deletar o registro com status `failed`
4. Rodar o cron novamente

```sql
-- Deletar notificação falhada para permitir reenvio
DELETE FROM whatsapp_notifications
WHERE patient_id = 'uuid-do-paciente'
AND notification_type = 'RENEWAL_D_7'
AND status = 'failed';
```

## Troubleshooting

### Notificações não sendo enviadas

1. Verificar se `WHATSAPP_ENABLED=true`
2. Verificar se o paciente tem `whatsappConsent=true`
3. Verificar se o telefone é válido
4. Verificar se já não foi enviado (consultar `whatsapp_notifications`)

### Templates não encontrados

Verificar no Meta Business Manager se os templates estão aprovados:
- `lembrete_vencimento_7_dias`
- `lembrete_vencimento_hoje`
- `lembrete_vencimento_30_dias`

### Mensagens indo para número errado

Em DEV, SEMPRE vai para `WHATSAPP_TEST_PHONE`. Configurar `WHATSAPP_ENV=prod` para enviar para os pacientes.

## Checklist de Implantação

- [ ] Criar templates no Meta Business Manager
- [ ] Aguardar aprovação dos templates
- [ ] Configurar variáveis de ambiente
- [ ] Testar em DEV com `WHATSAPP_TEST_PHONE`
- [ ] Configurar cron job (Vercel Cron ou node-cron)
- [ ] Monitorar logs na primeira execução
- [ ] Configurar alertas para falhas
- [ ] Documentar para o time

## Contato

Para dúvidas sobre implementação ou problemas, consultar:
- Documentação WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Código fonte: `src/cron/whatsapp-renewal-cron.ts`

