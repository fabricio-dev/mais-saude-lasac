# 📄 Configuração de Envio de PDFs via WhatsApp

## 🎯 Problema Resolvido

O PDF estava sendo enviado como arquivo binário corrompido porque o WhatsApp Business API precisa de uma **URL pública acessível** para baixar o arquivo, não um caminho de arquivo local.

## ✅ Solução Implementada

### 1. **Arquivo PDF na Pasta Public**

O PDF está localizado em:

```
public/docs/LISTA DE MÉDICOS E BENEFÍCIOS LASAC.pdf
```

Arquivos na pasta `public/` do Next.js são servidos estaticamente e ficam acessíveis via URL.

### 2. **URL Pública do PDF**

A URL pública do PDF é construída automaticamente usando a URL base da aplicação:

```typescript
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "https://seu-dominio.com";
const pdfUrl = `${appUrl}/docs/LISTA%20DE%20M%C3%89DICOS%20E%20BENEF%C3%8DCIOS%20LASAC.pdf`;
```

**Nota**: Os espaços e caracteres especiais no nome do arquivo são codificados em URL:

- Espaços → `%20`
- É → `%C3%89`
- Í → `%C3%8D`

### 3. **Configuração no `.env`**

Adicione a variável de ambiente no seu arquivo `.env`:

```bash
# URL pública da aplicação (usado para gerar links de PDFs e outros recursos)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com.br
```

**Exemplos:**

- **Produção**: `NEXT_PUBLIC_APP_URL=https://maissaudelasac.com.br`
- **Desenvolvimento**: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- **Staging**: `NEXT_PUBLIC_APP_URL=https://staging.maissaudelasac.com.br`

Se você não definir `NEXT_PUBLIC_APP_URL`, o sistema usará como fallback:

1. `BETTER_AUTH_URL` (já configurada)
2. `https://seu-dominio.com` (fallback final - **deve ser substituído**)

## 🔧 Como Funciona

### Fluxo de Envio:

1. **Paciente é ativado/criado** no sistema
2. **Sistema envia template de confirmação** via WhatsApp (texto)
3. **Após 3 segundos**, sistema envia o PDF usando o template `lista_de_parceiros`
4. **WhatsApp faz download** do PDF da URL pública
5. **Cliente recebe** o PDF no WhatsApp

### Código Responsável:

```typescript
// src/actions/upsert-patient/index.ts
// src/actions/activate-patient/index.ts

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  "https://seu-dominio.com";

const pdfUrl = `${appUrl}/docs/LISTA%20DE%20M%C3%89DICOS%20E%20BENEF%C3%8DCIOS%20LASAC.pdf`;

sendWhatsAppTemplateWithDocumentAsync(
  {
    phoneNumber: patient.phoneNumber,
    templateName: "lista_de_parceiros",
    documentUrl: pdfUrl, // URL pública acessível
  },
  3000, // delay de 3 segundos
);
```

## 📋 Template WhatsApp Necessário

### Criar Template no Meta Business Manager

Você precisa criar um template chamado `lista_de_parceiros` no Meta Business Manager:

**Informações Básicas:**

- **Template name**: `lista_de_parceiros`
- **Category**: `utility`
- **Languages**: `Portuguese (BR)` - pt_BR

**Header:**

- **Type**: `Document`
- **Format**: PDF

**Body:**

```
Aqui está a lista completa de médicos e benefícios do seu convênio Mais Saúde!

Aproveite todos os benefícios disponíveis para você e sua família.

Qualquer dúvida, estamos à disposição!
```

**Footer (Opcional):**

```
Mais Saúde - Cuidando de você
```

## 🧪 Testar em Desenvolvimento

### 1. **Usar ngrok ou similar**

Para testar localmente, você precisa expor seu servidor local com uma URL pública temporária:

```bash
# Instalar ngrok
npm install -g ngrok

# Expor porta 3000
ngrok http 3000
```

Você receberá uma URL como: `https://abc123.ngrok.io`

### 2. **Configurar `.env.local`**

```bash
NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
```

### 3. **Testar**

1. Reinicie o servidor Next.js
2. Crie/ative um paciente
3. Verifique se o PDF chega corretamente no WhatsApp

## ⚠️ Troubleshooting

### Problema: PDF não chega ou chega corrompido

**Possíveis causas:**

1. **URL não é pública/acessível**

   - ✅ Solução: Verificar se a URL funciona no navegador
   - Teste abrir: `https://seu-dominio.com/docs/LISTA%20DE%20M%C3%89DICOS%20E%20BENEF%C3%8DCIOS%20LASAC.pdf`

2. **Template não aprovado ou não existe**

   - ✅ Solução: Verificar no Meta Business Manager se o template `lista_de_parceiros` está APPROVED

3. **Arquivo não existe na pasta public/docs**

   - ✅ Solução: Verificar se o arquivo existe e o nome está correto (case-sensitive)

4. **CORS ou permissões**
   - ✅ Solução: Arquivos na pasta `public/` do Next.js são servidos com CORS aberto

### Logs para Monitorar

No terminal, você verá logs como:

```bash
# Sucesso
✅ Template WhatsApp "convenio_ativado" enviado com sucesso para 5511999999999 - ID: wamid.xxxxx
✅ Documento WhatsApp "lista_de_parceiros" enviado com sucesso para 5511999999999 - ID: wamid.xxxxx

# Erro
Erro ao enviar documento WhatsApp (tentativa 1): Invalid URL
```

## 📊 Verificar Envios

### No Meta Business Manager

1. Acesse: https://business.facebook.com/wa/manage/home
2. Vá em **Analytics** → **Conversations**
3. Veja as mensagens enviadas e o status

### No Sistema

Os logs aparecem no terminal onde o Next.js está rodando. Procure por:

- `✅ Documento WhatsApp` → Sucesso
- `Erro ao enviar documento WhatsApp` → Falha

## 🔒 Segurança

### Arquivos na Pasta Public

- ✅ **São públicos** - qualquer pessoa com a URL pode acessar
- ✅ **Não expõem dados sensíveis** - PDF contém apenas lista de médicos
- ✅ **Servidos diretamente pelo Next.js** - sem necessidade de lógica adicional

### Alternativa para Arquivos Privados

Se você precisar de arquivos privados no futuro, considere:

1. Usar um storage privado (S3, Google Cloud Storage)
2. Gerar URLs assinadas temporárias
3. Validar acesso antes de servir o arquivo

Mas para este caso (lista de parceiros), manter na pasta `public/` é adequado.

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Arquivo PDF está em `public/docs/`
- [ ] Template `lista_de_parceiros` está APPROVED no Meta Business Manager
- [ ] `NEXT_PUBLIC_APP_URL` configurada no `.env`
- [ ] Testado com número real (criar/ativar paciente)
- [ ] PDF chega corretamente no WhatsApp
- [ ] URL do PDF funciona no navegador
- [ ] Logs de sucesso aparecem no terminal

## 📞 Suporte

Se continuar com problemas:

1. Verificar logs do sistema
2. Testar URL do PDF manualmente no navegador
3. Verificar status do template no Meta Business Manager
4. Consultar documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#media-messages

