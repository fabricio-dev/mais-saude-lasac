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
