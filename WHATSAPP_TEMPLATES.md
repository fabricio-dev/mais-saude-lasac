# 📋 Guia Completo: Criar Templates WhatsApp Business API

> **Este guia descreve a conta antiga**, de quando o mais-saude chamava a Meta
> direto e os lembretes levavam o número de contato. Os modelos em uso hoje
> estão na seção **"Modelos atuais"**, mais abaixo.

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

# ✅ Modelos atuais — conta "Mais Saúde LASAC" (outubro de 2026)

Os modelos foram recriados na conta do WhatsApp Business **"Mais Saúde LASAC"
(WABA 3040272662979703)**, com os mesmos nomes de antes. O texto aprovado de
cada um é o que está no **WhatsApp Manager → Modelos de mensagem**; os textos
abaixo são os que foram enviados para análise.

O que mudou em relação aos modelos antigos:

- **Os lembretes não levam mais o número de contato** (`wa.me/...`). O envio
  sai do mesmo número do atendimento (pelo whatsapp-ai), então o paciente
  responde ali mesmo.
- **As confirmações levam a lista de parceiros em PDF no cabeçalho.** É uma
  mensagem por confirmação, em vez de duas. O `lista_de_parceiros` não foi
  criado na conta nova.
- **Dois botões de resposta rápida nos lembretes:** `Já renovei` (em cima) e
  `Quero renovar` (embaixo). Não há botão de descadastro: quem responder
  SAIR, PARE ou "não quero mais receber" é descadastrado pelo whatsapp-ai.
- **Rodapé com o SAIR** no lembrete de 30 dias e nas confirmações:
  `Caso não queira mais receber nossos avisos, responda SAIR.`

## Qual modelo sai em cada mensagem

| Mensagem | Modelo | Variáveis | Cabeçalho | Botões | Rodapé SAIR |
|---|---|---|---|---|---|
| 7 dias antes | `lembrete_vencimento_7_dias` | {{1}} primeiro nome, {{2}} vencimento | texto fixo | Já renovei · Quero renovar | — |
| No dia | `lembrete_vencimento_hoje` | {{1}} primeiro nome | `Seu cartão vence hoje` | Já renovei · Quero renovar | — |
| Vencido sem aviso no dia | `lembrete_vencimento_atrasado` | {{1}} primeiro nome, {{2}} vencimento | `Seu cartão venceu` | Já renovei · Quero renovar | — |
| 30 dias ou mais | `lembrete_vencimento_30_dias` | {{1}} primeiro nome | `Seu cartão está vencido` | Já renovei · Quero renovar | sim |
| Ativação | `convenio_ativado` | {{1}} primeiro nome, {{2}} validade, {{3}} unidade | PDF da lista | — | sim |
| Renovação | `convenio_renovado` | {{1}} primeiro nome, {{2}} nova validade, {{3}} unidade | PDF da lista | — | sim¹ |
| Renovação antecipada | `convenio_renovado_antecipado` | {{1}} primeiro nome, {{2}} nova validade, {{3}} unidade | PDF da lista | — | sim |

¹ O `convenio_renovado` foi enviado sem o rodapé; ele entra numa edição depois
da aprovação (a Meta permite editar modelo aprovado uma vez a cada 24h).

**Onde isso é configurado:** na tela **/whatsapp** do mais-saude, cartão
"Modelos das mensagens". Lá se escolhe o modelo de cada mensagem e de onde
vem cada variável. Sem escolha, valem os padrões da tabela acima
(`DEFAULT_MESSAGE_TEMPLATES` em `src/lib/whatsapp/message-templates.ts`).
Trocar de modelo ou de variáveis não exige mudar código: crie o modelo,
espere a aprovação e escolha na tela.

**Regras para criar modelos que o sistema consegue enviar:**

- Cabeçalho de texto **sem variável**. Variável no cabeçalho não é suportada.
- Lembretes não podem ter mídia no cabeçalho. Confirmações podem ter
  **documento** (o PDF de parceiros) ou nada.
- Botões de resposta rápida chegam ao atendimento como mensagem do paciente,
  e aparecem no relatório "Envios automáticos" do whatsapp-ai.
- Modelo aprovado pode ser editado, mas mudar a quantidade de variáveis
  exige ajustar a escolha na tela /whatsapp.

## Textos enviados para análise

### `lembrete_vencimento_7_dias`

```
Oi, {{1}}! Tudo bem? 😊 Passando para lembrar que seu cartão Mais Saúde LASAC vence em {{2}}. Renovando antes, você continua aproveitando seus benefícios sem nenhuma pausa. Quer ajuda para renovar? É só responder esta mensagem que a gente cuida de tudo.
```

### `lembrete_vencimento_hoje`

```
Oi, {{1}}! Tudo bem? Hoje é o último dia de validade do seu cartão Mais Saúde LASAC. Para você não ficar sem seus benefícios, é só responder esta mensagem que a gente te ajuda a renovar. 😊
```

### `lembrete_vencimento_atrasado`

Só sai com o lembrete "Vencido sem aviso no dia" ligado na tela /whatsapp.

```
Oi, {{1}}! Tudo bem? Seu cartão Mais Saúde LASAC venceu em {{2}}, mas ainda dá tempo de renovar e voltar a aproveitar seus benefícios. É só responder esta mensagem que a gente cuida de tudo. 😊
```

### `lembrete_vencimento_30_dias`

```
Oi, {{1}}! Tudo bem? Seu cartão Mais Saúde LASAC está vencido há mais de 30 dias. Se quiser renovar e voltar a ter seus benefícios, é só responder esta mensagem que a gente te ajuda. 😊
```

### `convenio_ativado`

```
Oi, {{1}}! Seja bem-vindo(a) ao Mais Saúde LASAC! 😊

Seu cartão foi ativado com sucesso e você já pode aproveitar seus benefícios.

📅 Validade: {{2}}
🏥 Unidade: {{3}}

No arquivo acima está a lista de profissionais credenciados. Se precisar de alguma coisa, é só responder esta mensagem.
```

### `convenio_renovado`

```
Oi, {{1}}! Que bom ter você com a gente de novo! 😊

Seu cartão Mais Saúde LASAC foi renovado com sucesso.

📅 Nova validade: {{2}}
🏥 Unidade: {{3}}

No arquivo acima está a lista de profissionais credenciados. Se precisar de alguma coisa, é só responder esta mensagem.
```

### `convenio_renovado_antecipado`

```
Oi, {{1}}! Obrigado por renovar antes do vencimento! 😊

Seu cartão Mais Saúde LASAC já está renovado, e o tempo que ainda faltava foi somado à nova validade.

📅 Nova validade: {{2}}
🏥 Unidade: {{3}}

No arquivo acima está a lista de profissionais credenciados. Se precisar de alguma coisa, é só responder esta mensagem.
```

---

## 🧪 Experimento a fazer: ordem dos botões dos lembretes

_Anotado em 2026-10-15, na criação dos modelos novos na conta do WhatsApp
"Mais Saúde LASAC" (WABA 3040272662979703), enviados pelo whatsapp-ai._

Os lembretes novos têm dois botões de resposta rápida. A ordem aprovada é:

1. `Já renovei` (em cima)
2. `Quero renovar` (embaixo)

`Quero renovar` ficou embaixo porque, no celular, o polegar alcança mais fácil
o que está perto da borda de baixo. O argumento contrário é que o olho lê de
cima para baixo, e o primeiro botão é o que se vê primeiro. Nenhum dos dois tem
dado por trás.

**O teste:** criar uma cópia de um dos lembretes com a ordem invertida
(`Quero renovar` em cima) e comparar se as renovações aumentam.

- Mude só a ordem. Texto, cabeçalho e rodapé ficam iguais, senão não dá para
  saber o que fez diferença.
- O modelo aprovado não pode ser editado, então a cópia precisa de outro nome,
  por exemplo `lembrete_vencimento_7_dias_b`. Ela também passa pela revisão da
  Meta.
- Alterne entre as duas versões, por exemplo por semana ou por paciente par e
  ímpar, para os dois grupos serem parecidos.
- **Medida:** a proporção de pacientes que renovam até 7 dias depois do
  lembrete, em cada versão. Os toques em `Quero renovar` ajudam a entender, mas
  o que importa é a renovação.
- Espere juntar algumas centenas de lembretes por versão antes de concluir.
  Com poucos envios, a diferença pode ser acaso.
- Use a mesma ordem em todos os lembretes de cada versão, para o paciente
  encontrar o botão sempre no mesmo lugar.
