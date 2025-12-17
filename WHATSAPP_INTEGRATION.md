# 📱 Integração WhatsApp - Documentação

## 📋 Visão Geral

Sistema de envio automático de mensagens WhatsApp quando um paciente é **criado**, **ativado** ou tem seu convênio **renovado**.

### ✅ Funcionalidades Implementadas

- ✅ Envio automático de WhatsApp na criacao/ativação/renovação
- ✅ Templates personalizados para cada situação:
  - **Primeira ativação**: Mensagem de boas-vindas
  - **Renovação**: Mensagem de agradecimento
  - **Renovação antecipada**: Mensagem especial preservando dias restantes
- ✅ Retry automático (2 tentativas) em caso de falha
- ✅ Não bloqueia a ativação caso o WhatsApp falhe
- ✅ Logs detalhados para debug
- ✅ Flag para ativar/desativar facilmente

---

## ⚠️ IMPORTANTE: Templates Obrigatórios

A **WhatsApp Business API oficial do Meta** exige que mensagens de notificação sejam enviadas usando **templates pré-aprovados**.

### 📋 Você precisa:

1. ✅ Criar 3 templates no Meta Business Manager
2. ✅ Aguardar aprovação (24-48h)
3. ✅ Configurar credenciais da API

**📖 Guia Completo**: Veja o arquivo `WHATSAPP_TEMPLATES_GUIDE.md` para instruções detalhadas de como criar os templates.

---

## 🚀 Como Configurar

### 1. Criar Templates no Meta Business Manager

Você já tem uma conta, então precisa apenas pegar estas informações:

#### **Phone Number ID**

1. Acesse: https://business.facebook.com/latest/whatsapp_manager
2. Selecione sua conta WhatsApp Business
3. Vá em **"Números de telefone"**
4. Copie o **Phone Number ID** (um número longo)

#### **Access Token (Permanente)**

1. No mesmo painel, vá em **"Ferramentas do Sistema"** → **"App tokens"**
2. Gere um token permanente ou use o existente
3. **Importante**: Use um token permanente, não temporário!

#### **API URL**

A URL base da API do Meta é:

```
https://graph.facebook.com/v22.0
```

(ou se preferir versão mais recente)

---

### 2. Configurar Variáveis de Ambiente

Adicione estas variáveis no seu arquivo `.env` (ou `.env.local`):

```bash
# WhatsApp Business API (Meta) Configuration
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v22.0
WHATSAPP_ACCESS_TOKEN=SEU_TOKEN_PERMANENTE_AQUI
WHATSAPP_PHONE_NUMBER_ID=SEU_PHONE_NUMBER_ID_AQUI
```

#### ⚙️ Variáveis Explicadas:

| Variável                   | Descrição                     | Exemplo                            |
| -------------------------- | ----------------------------- | ---------------------------------- |
| `WHATSAPP_ENABLED`         | Ativa/desativa o envio        | `true` ou `false`                  |
| `WHATSAPP_API_URL`         | URL base da API do Meta       | `https://graph.facebook.com/v22.0` |
| `WHATSAPP_ACCESS_TOKEN`    | Token permanente da sua conta | `EAAxxxxxxxxxxxxxxx`               |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número de telefone      | `123456789012345`                  |

---

### 3. Verificar Status dos Templates

Antes de testar, certifique-se que os templates estão aprovados:

1. Acesse: https://business.facebook.com/wa/manage/message-templates
2. Verifique se os 3 templates têm status **APPROVED** ✅
3. Se estiver **PENDING** ⏳, aguarde aprovação

---

### 4. Testar a Integração

#### **Teste 1: Desabilitar WhatsApp**

```bash
# No .env
WHATSAPP_ENABLED=false
```

- Ative um paciente
- ✅ Deve ativar normalmente SEM enviar WhatsApp
- ✅ Deve aparecer log: "WhatsApp desabilitado"

#### **Teste 2: Habilitar e Testar**

```bash
# No .env
WHATSAPP_ENABLED=true
```

- Ative um paciente **de teste** com seu próprio número
- ✅ Deve receber mensagem de ativação
- ✅ Deve aparecer log: "WhatsApp enviado com sucesso"

#### **Teste 3: Renovar Paciente**

- Renove um paciente que já está ativo
- ✅ Deve receber mensagem de renovação diferente

---

## 📝 Exemplos de Mensagens

### 🎉 Primeira Ativação

```
Olá João!

Seu convênio Mais Saúde foi ativado com sucesso!

Validade até: 17/12/2026
Unidade: Clínica São Paulo

Bem-vindo(a) à família Mais Saúde! Agora você tem acesso a uma rede completa de serviços de saúde.

Qualquer dúvida, estamos à disposição!
```

## 🔧 Arquivos Criados

### Estrutura de Pastas

```
src/
├── lib/
│   └── whatsapp/
│       ├── client.ts          # Cliente da API do WhatsApp
│       ├── templates.ts       # Templates de mensagens
│       └── utils.ts           # Utilitários (formatação)
├── actions/
│   └── activate-patient/
│       └── index.ts           # ✏️ Modificado (envio WhatsApp)
```

### 📁 Descrição dos Arquivos

#### `client.ts`

- Função `sendWhatsAppMessage()`: Envia mensagens
- Função `sendWhatsAppMessageAsync()`: Envia sem bloquear
- Retry automático (2 tentativas)
- Validações de telefone e configuração

#### `templates.ts`

- `getActivationMessageTemplate()`: Primeira ativação
- `getRenewalMessageTemplate()`: Renovação normal
- `getEarlyRenewalMessageTemplate()`: Renovação antecipada
- `getMessageTemplate()`: Seleciona template correto

#### `utils.ts`

- `formatPhoneNumber()`: Formata para padrão internacional
- `isValidPhoneNumber()`: Valida número
- `maskPhoneNumber()`: Mascara para logs (privacidade)

---

## 🐛 Troubleshooting

### 🔴 Erros Relacionados a Templates

#### Problema: Erro 132000 - Template não encontrado

**Solução**:

- Template não existe ou nome está incorreto
- Verifique se os templates estão criados: `convenio_ativado`, `convenio_renovado`, `convenio_renovado_antecipado`
- Nomes devem ser exatamente iguais (case sensitive)

#### Problema: Erro 133000 - Template não aprovado

**Solução**:

- Template ainda está em aprovação (PENDING)
- Aguarde aprovação do Meta (24-48h)
- Verifique status em: https://business.facebook.com/wa/manage/message-templates

#### Problema: Erro 131026 - Parameter Invalid (Templates)

**Solução**:

- Número de parâmetros não corresponde ao template
- Templates têm 3 parâmetros: {{1}} (nome), {{2}} (data), {{3}} (clínica)
- Verifique se todos estão sendo enviados corretamente

### 🔴 Outros Erros Comuns

### Problema: "Configurações do WhatsApp não encontradas"

**Solução**: Verifique se todas as variáveis de ambiente estão configuradas corretamente no `.env`

### Problema: "Número de telefone inválido"

**Solução**:

- Verifique se o paciente tem telefone cadastrado
- Formato aceito: `(11) 99999-9999` ou `11999999999`
- O sistema formata automaticamente para `5511999999999`

### Problema: Erro HTTP 401 - Unauthorized

**Solução**:

- Token de acesso inválido ou expirado
- Gere um novo token permanente no Meta Business

### Problema: Erro HTTP 403 - Forbidden

**Solução**:

- Número não está registrado no WhatsApp Business
- Verifique se o número de telefone está ativo na conta

### Problema: Erro 131026 - Parameter Invalid

**Solução**:

- Formato de mensagem ou telefone incorreto
- Verifique os logs para detalhes

---

## 📊 Logs e Monitoramento

### Logs de Sucesso

```
Tentativa 1/2 - Enviando WhatsApp para 5511999999999
✅ WhatsApp enviado com sucesso para 5511999999999 - ID: wamid.xxxxx
```

### Logs de Erro

```
Erro ao enviar WhatsApp (tentativa 1): Parameter invalid
Erro crítico ao enviar WhatsApp: Error: ...
```

### Verificar Logs em Produção

```bash
# Se estiver usando servidor
tail -f logs/application.log | grep WhatsApp

# Se estiver usando Vercel/similar
# Acesse o painel de logs do seu provedor
```

---

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

- ✅ Token de acesso **nunca** é exposto no código
- ✅ Números de telefone são mascarados nos logs
- ✅ Validações de entrada antes de enviar
- ✅ Rate limiting do Meta é respeitado (retry com delay)

### ⚠️ Atenção

- **Nunca** commite o arquivo `.env` no git
- Use tokens permanentes para produção
- Monitore o uso da API no painel do Meta

---

## 🎯 Funcionalidades Futuras (Sugestões)

### 📈 Melhorias Possíveis

1. **Dashboard de Mensagens**

   - Histórico de mensagens enviadas
   - Taxa de sucesso/falha
   - Re-envio manual

2. **Mensagens Programadas**

   - Lembrete antes de expirar (30/15/7 dias)
   - Parabéns no aniversário
   - Pesquisa de satisfação pós-consulta

3. **Templates Personalizados**

   - Cada clínica pode ter templates próprios
   - Upload de mídia (logo, banners)
   - Botões interativos

4. **Multi-Canal**
   - SMS como fallback
   - Email como segunda opção
   - Notificações push

---

## 📞 Suporte

### Documentação Oficial Meta

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Sending Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)
- [Error Codes](https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes)

### Contato

Para dúvidas sobre a implementação, verifique:

1. Os logs do sistema
2. A documentação do Meta
3. As mensagens de erro no console

---

## ✅ Checklist de Deploy

Antes de colocar em produção:

- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Token permanente gerado e testado
- [ ] Teste com número real realizado
- [ ] Logs funcionando corretamente
- [ ] `WHATSAPP_ENABLED=true` em produção
- [ ] Monitoramento configurado
- [ ] Backup das credenciais em local seguro

---

**🎉 Implementação Concluída!**

Sistema pronto para uso. Basta configurar as credenciais e ativar!
