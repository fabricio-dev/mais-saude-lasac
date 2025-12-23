# 📋 Guia Completo: Criar Templates WhatsApp Business API

## 🎯 O que são Templates?

Templates são **mensagens pré-aprovadas** pelo Meta que permitem iniciar conversas com clientes no WhatsApp Business API. Eles são obrigatórios para enviar notificações.

---

## 📝 Passo a Passo para Criar Templates

### **1️⃣ Acessar o Meta Business Manager**

1. Acesse: https://business.facebook.com/wa/manage/message-templates
2. Faça login com sua conta Meta Business
3. Selecione sua conta WhatsApp Business

---

### **2️⃣ Criar Template de Ativação**

#### **Clique em "Create Template"**

**Informações Básicas:**

- **Template name**: `convenio_ativado`
- **Category**: `utility`
- **Languages**: `Portuguese (BR)` - pt_BR

#### **Conteúdo do Template:**

**Header** (Opcional): Deixe em branco ou adicione:

```
Mais Saúde 💚
```

**Body** (Obrigatório):

```
Olá {{1}}!

Seu convênio Mais Saúde foi ativado com sucesso! ✅

📅 Validade até: {{2}}
🏥 Unidade: {{3}}

Bem-vindo(a) à família Mais Saúde!

Qualquer dúvida, estamos à disposição.
```

**Footer** (Opcional):

```
Mais Saúde - Cuidando de você
```

**Buttons** (Opcional): Pode deixar em branco

#### **Variáveis Explicadas:**

- `{{1}}` = Nome do paciente (primeiro nome)
- `{{2}}` = Data de validade (formato: DD/MM/YYYY)
- `{{3}}` = Nome da clínica/unidade

#### **Exemplo de Mensagem Final:**

```
Olá João!

Seu convênio Mais Saúde foi ativado com sucesso! ✅

📅 Validade até: 17/12/2026
🏥 Unidade: Clínica Centro

Bem-vindo(a) à família Mais Saúde!

Qualquer dúvida, estamos à disposição.
```

---

### **3️⃣ Criar Template de Renovação**

**Informações Básicas:**

- **Template name**: `convenio_renovado`
- **Category**: `utility`
- **Languages**: `Portuguese (BR)` - pt_BR

**Body:**

```
Olá {{1}}!

Seu convênio Mais Saúde foi renovado! 🔄

📅 Nova validade até: {{2}}
🏥 Unidade: {{3}}

Obrigado por continuar conosco! Sua saúde é nossa prioridade.

Qualquer dúvida, estamos à disposição.
```

**Variáveis:**

- `{{1}}` = Nome do paciente
- `{{2}}` = Nova data de validade
- `{{3}}` = Nome da clínica

---

### **4️⃣ Criar Template de Renovação Antecipada**

**Informações Básicas:**

- **Template name**: `convenio_renovado_antecipado`
- **Category**: `utility`
- **Languages**: `Portuguese (BR)` - pt_BR

**Body:**

```
Olá {{1}}!

Seu convênio Mais Saúde foi renovado antecipadamente! 🔄⚡

📅 Nova validade até: {{2}}
🏥 Unidade: {{3}}

Obrigado pela renovação antecipada! Seu tempo adicional foi preservado.

Qualquer dúvida, estamos à disposição.
```

**Variáveis:**

- `{{1}}` = Nome do paciente
- `{{2}}` = Nova data de validade (com dias extras)
- `{{3}}` = Nome da clínica

---

## ⏱️ Processo de Aprovação

### **Após Submeter os Templates:**

1. **Status**: PENDING (Aguardando aprovação)
2. **Tempo**: 24-48 horas (normalmente mais rápido)
3. **Notificação**: Você receberá email quando aprovado/rejeitado

### **Possíveis Status:**

- ✅ **APPROVED**: Template aprovado, pronto para uso
- ⏳ **PENDING**: Aguardando revisão do Meta
- ❌ **REJECTED**: Rejeitado (veja motivo e corrija)

---

## 🚫 Motivos Comuns de Rejeição

### **O que NÃO fazer:**

❌ **Conteúdo promocional excessivo**

```
❌ COMPRE AGORA! 50% OFF! APROVEITE!
```

❌ **Informações sensíveis ou médicas**

```
❌ Seu diagnóstico de diabetes...
❌ Resultado do seu exame...
```

❌ **Informações financeiras diretas**

```
❌ Sua fatura de R$ 150,00 venceu
```

❌ **URLs ou links não aprovados**

```
❌ Acesse: http://meusite.com/promo
```

### **O que FAZER:**

✅ **Notificações transacionais**

```
✅ Seu convênio foi ativado
✅ Data de validade atualizada
```

✅ **Informações úteis ao cliente**

```
✅ Confirmações de ações
✅ Atualizações de status
```

✅ **Tom profissional e respeitoso**

```
✅ Linguagem clara e objetiva
✅ Emojis moderados (max 2-3)
```

---

## 🔧 Configurar Variáveis de Ambiente

Após os templates serem aprovados, adicione no `.env`:

```bash
# WhatsApp Business API Configuration
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_ACCESS_TOKEN=seu_token_permanente
WHATSAPP_PHONE_NUMBER_ID=xxxxcxxxxxxxxxx

# Nomes dos templates (devem coincidir com os criados)
# Não é necessário adicionar, já está no código:
# - convenio_ativado
# - convenio_renovado
# - convenio_renovado_antecipado
```

---

## 🧪 Testar Templates

### **Método 1: Pelo Meta Business Manager**

1. Acesse o template aprovado
2. Clique em "Send Test Message"
3. Digite seu número de telefone
4. Preencha as variáveis de exemplo
5. Envie e verifique no WhatsApp

### **Método 2: Pelo Sistema**

1. Configure o `.env` com credenciais corretas
2. Certifique-se que `WHATSAPP_ENABLED=true`
3. Crie um paciente de teste com seu número
4. Ative o paciente
5. Verifique se recebeu a mensagem

---

## 📊 Logs e Monitoramento

### **Logs de Sucesso:**

```bash
Tentativa 1/2 - Enviando template WhatsApp "convenio_ativado" para 5511999999999
✅ Template WhatsApp "convenio_ativado" enviado com sucesso para 5511999999999 - ID: wamid.xxxxx
```

### **Logs de Erro Comuns:**

#### **Erro 132000 - Template não encontrado**

```bash
Erro ao enviar template WhatsApp (tentativa 1): Template não encontrado
```

**Solução**: Verifique se o nome do template está correto e aprovado

#### **Erro 131026 - Parâmetros inválidos**

```bash
Erro ao enviar template WhatsApp (tentativa 1): Invalid parameter
```

**Solução**: Número de parâmetros não corresponde ao template

#### **Erro 133000 - Template não aprovado**

```bash
Erro ao enviar template WhatsApp (tentativa 1): Template status is not APPROVED
```

**Solução**: Aguarde aprovação do template

---

## 🎯 Checklist de Templates

Antes de ir para produção, verifique:

### **Templates:**

- [ ] Template `convenio_ativado` criado
- [ ] Template `convenio_renovado` criado
- [ ] Template `convenio_renovado_antecipado` criado
- [ ] Todos os templates com status APPROVED
- [ ] Testado cada template manualmente
- [ ] Variáveis {{1}}, {{2}}, {{3}} funcionando

### **Configuração:**

- [ ] `.env` configurado corretamente
- [ ] `WHATSAPP_ENABLED=true`
- [ ] Token permanente válido
- [ ] Phone Number ID correto
- [ ] API URL correta (v22.0 ou superior)

### **Testes:**

- [ ] Criar paciente novo → Recebe mensagem
- [ ] Ativar paciente → Recebe mensagem
- [ ] Renovar paciente → Recebe mensagem correta
- [ ] Renovar antecipado → Recebe mensagem correta
- [ ] Logs aparecem corretamente no terminal

---

## 🔄 Atualizar Templates

Se precisar modificar um template:

1. **Não pode editar template aprovado diretamente**
2. **Crie uma nova versão** do template
3. **Aguarde aprovação** da nova versão
4. **Atualize o código** com o novo nome (se necessário)
5. **Template antigo** continua funcionando até ser desativado

---

## 📞 Suporte Meta

### **Documentação Oficial:**

- [Message Templates Overview](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates)
- [Create Templates](https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates/create)
- [Template Guidelines](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines)

### **Contato:**

- Support: https://business.facebook.com/business/help
- Developer Docs: https://developers.facebook.com/docs/whatsapp

---

## ✅ Pronto!

Após criar e aprovar os 3 templates, o sistema estará pronto para enviar notificações automáticas! 🎉

**Tempo estimado total**: 2-3 dias (incluindo aprovação do Meta)

# ✅ Templates do WhatsApp - Nomes Corretos

Os templates aprovados na Meta Business Manager com seus nomes corretos:

## Templates de Lembrete de Vencimento

### 1. `lembrete_vencimento_7_dias`

**Uso:** Enviar 7 dias antes do vencimento (D-7)

**Conteúdo do template aprovado:**

```
Mensagem automática do Sistema Mais Saude LASAC.

Olá, {{1}}. Este é um lembrete importante: seu cartão LASAC vence em {{2}}.

Para evitar a interrupção dos benefícios, realize a renovação dentro do prazo informado.

Para dúvidas ou atendimento, utilize o WhatsApp oficial:

👉 wa.me/{{3}} e fale com nossa equipe.
```

**Parâmetros:**

- `{{1}}` - Primeiro nome do paciente
- `{{2}}` - Data de expiração (formato DD/MM/YYYY)
- `{{3}}` - Número oficial do WhatsApp (vem do .env: WHATSAPP_OFFICIAL_NUMBER)

---

### 2. `lembrete_vencimento_hoje`

**Uso:** Enviar no dia do vencimento (D0)

**Conteúdo do template aprovado:**

```
Mensagem automática do Sistema LASAC.

Olá, {{1}}. Informamos que, na data de hoje, ocorre o vencimento do seu cartão LASAC.

Para continuar utilizando os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/{{2}} para receber suporte.
```

**Parâmetros:**

- `{{1}}` - Primeiro nome do paciente
- `{{2}}` - Número oficial do WhatsApp (vem do .env: WHATSAPP_OFFICIAL_NUMBER)

⚠️ **Importante:** Este template usa apenas 2 parâmetros (não usa data)

---

### 3. `lembrete_vencimento_30_dias`

**Uso:** Enviar 30 dias após o vencimento (D+30)

**Conteúdo do template aprovado:**

```
Mensagem automática do Sistema LASAC.

Olá, {{1}}. Identificamos que o seu cartão LASAC encontra-se vencido há mais de 30 dias.

Para retomar os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/{{2}} para receber suporte.
```

**Parâmetros:**

- `{{1}}` - Primeiro nome do paciente
- `{{2}}` - Número oficial do WhatsApp (vem do .env: WHATSAPP_OFFICIAL_NUMBER)

⚠️ **Importante:** Este template usa apenas 2 parâmetros (não usa data)

---

## 📱 Configuração do Número Oficial

O terceiro parâmetro dos templates de lembrete (`{{3}}`) é o **número oficial do WhatsApp** da empresa/clínica.

### Como Configurar

Adicionar no arquivo `.env`:

```env
# Número oficial do WhatsApp para aparecer nos templates
# Esse número será exibido nas mensagens de lembrete
WHATSAPP_OFFICIAL_NUMBER=(11) 91234-5678
```

### Formatos Aceitos

```env
# Com máscara (recomendado)
WHATSAPP_OFFICIAL_NUMBER=(11) 91234-5678
WHATSAPP_OFFICIAL_NUMBER=(11) 1234-5678

# Sem máscara
WHATSAPP_OFFICIAL_NUMBER=11912345678
WHATSAPP_OFFICIAL_NUMBER=1112345678
```

### Por que usar variável de ambiente?

✅ **Fácil manutenção**: Mudar o número em um único lugar  
✅ **Sem redeployar código**: Apenas atualizar a variável no Vercel  
✅ **Flexibilidade**: Diferentes números para dev/staging/prod  
✅ **Sem hardcode**: Não precisa editar código para mudar número

### Exemplo de Uso no Código

```typescript
// src/lib/whatsapp/templates.ts

const officialWhatsApp =
  process.env.WHATSAPP_OFFICIAL_NUMBER || "(11) 91234-5678";

// Usado nos templates de renovação
case "renewal_reminder_d7":
  return {
    name: "lembrete_vencimento_7_dias",
    parameters: [firstName, formattedDate, officialWhatsApp], // ← aqui
  };
```

### Fallback

Se `WHATSAPP_OFFICIAL_NUMBER` não estiver configurado, o sistema usa o fallback: `(11) 91234-5678`

⚠️ **Importante**: Configure essa variável antes de ir para produção!

---

## Configuração no Código

Os nomes dos templates já estão configurados corretamente em:

### `src/lib/whatsapp/templates.ts`

```typescript
export function getTemplateConfig(
  type:
    | "activation"
    | "renewal"
    | "early_renewal"
    | "renewal_reminder_d7"
    | "renewal_reminder_d0"
    | "renewal_reminder_d30",
  params: MessageTemplateParams,
): TemplateConfig {
  // ...

  // Número oficial do WhatsApp (busca do .env para facilitar mudanças)
  const officialWhatsApp =
    process.env.WHATSAPP_OFFICIAL_NUMBER || "(11) 91234-5678";

  switch (type) {
    case "renewal_reminder_d7":
      return {
        name: "lembrete_vencimento_7_dias", // ✅
        parameters: [firstName, formattedDate, officialWhatsApp], // ✅ 3 parâmetros
      };

    case "renewal_reminder_d0":
      return {
        name: "lembrete_vencimento_hoje", // ✅
        parameters: [firstName, officialWhatsApp], // ✅ 2 parâmetros (sem data)
      };

    case "renewal_reminder_d30":
      return {
        name: "lembrete_vencimento_30_dias", // ✅
        parameters: [firstName, officialWhatsApp], // ✅ 2 parâmetros (sem data)
      };
  }
}
```

---

## Mapeamento Tipo → Template

| Tipo de Notificação | Template WhatsApp             | Parâmetros           | Quando Enviar  |
| ------------------- | ----------------------------- | -------------------- | -------------- |
| `RENEWAL_D_7`       | `lembrete_vencimento_7_dias`  | nome, data, whatsapp | 7 dias antes   |
| `RENEWAL_D_0`       | `lembrete_vencimento_hoje`    | nome, whatsapp       | No dia         |
| `RENEWAL_D_30`      | `lembrete_vencimento_30_dias` | nome, whatsapp       | 30 dias depois |

⚠️ **Atenção:** Os templates D0 e D+30 usam apenas 2 parâmetros (sem data)

---

## Checklist de Verificação

### No Meta Business Manager

- [ ] Template `lembrete_vencimento_7_dias` está criado
- [ ] Template `lembrete_vencimento_hoje` está criado
- [ ] Template `lembrete_vencimento_30_dias` está criado
- [ ] Todos os templates estão **aprovados**
- [ ] Categoria definida como **Marketing** (requer opt-in)
- [ ] Idioma configurado como **pt_BR**

### No Código

- [x] `templates.ts` atualizado com nomes corretos
- [x] Documentação atualizada
- [x] Nenhuma alteração necessária no cron (usa getTemplateConfig)

---

## Importante

⚠️ **Os templates devem estar aprovados na Meta antes de executar o cron em produção!**

Tempo de aprovação: Pode levar até 24 horas.

Status de aprovação: Verificar em Meta Business Manager > WhatsApp Manager > Message Templates

---

## Teste

Para testar se os templates estão funcionando:

```bash
# 1. Configurar ambiente DEV
WHATSAPP_ENV=dev
WHATSAPP_TEST_PHONE=seu_numero

# 2. Executar teste
npx ts-node src/scripts/test-whatsapp-cron.ts

# 3. Verificar mensagem recebida no seu WhatsApp
```

---

## Exemplo de Mensagem Recebida

**Template:** `lembrete_vencimento_7_dias` (D-7)

```
Mensagem automática do Sistema Mais Saude LASAC.

Olá, João. Este é um lembrete importante: seu cartão LASAC vence em 27/12/2024.

Para evitar a interrupção dos benefícios, realize a renovação dentro do prazo informado.

Para dúvidas ou atendimento, utilize o WhatsApp oficial:

👉 wa.me/5511912345678 e fale com nossa equipe.
```

**Template:** `lembrete_vencimento_hoje` (D0)

```
Mensagem automática do Sistema LASAC.

Olá, João. Informamos que, na data de hoje, ocorre o vencimento do seu cartão LASAC.

Para continuar utilizando os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/5511912345678 para receber suporte.
```

**Template:** `lembrete_vencimento_30_dias` (D+30)

```
Mensagem automática do Sistema LASAC.

Olá, João. Identificamos que o seu cartão LASAC encontra-se vencido há mais de 30 dias.

Para retomar os benefícios normalmente, é necessário realizar a renovação.

Para dúvidas ou atendimento, fale conosco pelo WhatsApp oficial:

👉 wa.me/5511912345678 para receber suporte.
```

✅ Templates configurados e prontos para uso!
