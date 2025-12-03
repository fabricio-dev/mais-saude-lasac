# 📋 Google Forms - Dados para Adaptação do Sistema

> **Instruções:** Copie e cole cada seção no Google Forms conforme indicado

---

## 🎯 CONFIGURAÇÕES INICIAIS DO FORMS

**Acesse:** https://forms.google.com

**Título do Formulário:**
```
Dados para Adaptação do Sistema de Gestão
```

**Descrição:**
```
Precisamos coletar algumas informações para personalizar o sistema de gestão de convênios com a identidade e regras de negócio da sua empresa.

Por favor, preencha todos os campos possíveis. Quanto mais completo, mais rápido conseguiremos entregar!

⏱️ Tempo estimado: 10-15 minutos
```

---

## 📝 SEÇÕES E CAMPOS DO FORMULÁRIO

### ═══════════════════════════════════════
### SEÇÃO 1: IDENTIDADE VISUAL
### ═══════════════════════════════════════

**Adicionar Seção:** "1. Identidade Visual 🎨"

**Descrição da seção:**
```
Enviaremos os arquivos de logo por e-mail ou link, mas precisamos saber as cores da marca.
```

---

#### Campo 1.1: Logo Principal
- **Tipo:** Texto curto
- **Pergunta:** Você já tem o logo da empresa em formato digital?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, enviarei por e-mail
  - Sim, segue o link: [campo de texto]
  - Não, preciso criar ainda

---

#### Campo 1.2: Cor Principal
- **Tipo:** Texto curto
- **Pergunta:** Cor Principal da Marca (Hexadecimal)
- **Obrigatório:** Não
- **Texto de ajuda:** 
```
Digite o código da cor principal em formato hexadecimal.
Exemplo: #FF5733 ou #1E90FF
Não sabe o código? Use: https://htmlcolorcodes.com/
```
- **Validação:** Expressão regular `^#[0-9A-Fa-f]{6}$`

---

#### Campo 1.3: Cor Secundária
- **Tipo:** Texto curto
- **Pergunta:** Cor Secundária da Marca (Hexadecimal)
- **Obrigatório:** Não
- **Texto de ajuda:** 
```
Cor secundária ou complementar (se houver)
Exemplo: #2C3E50
```
- **Validação:** Expressão regular `^#[0-9A-Fa-f]{6}$`

---

#### Campo 1.4: Manual de Marca
- **Tipo:** Múltipla escolha
- **Pergunta:** Vocês possuem Manual de Identidade Visual ou Brandbook?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, enviarei por e-mail
  - Sim, segue o link
  - Não possuo

---

#### Campo 1.5: Link para Materiais
- **Tipo:** Texto longo
- **Pergunta:** Links para Logos e Materiais (Google Drive, Dropbox, etc.)
- **Obrigatório:** Não
- **Texto de ajuda:**
```
Se preferir, compartilhe uma pasta com todos os arquivos de logo, 
cores e outros materiais visuais.
```

---

### ═══════════════════════════════════════
### SEÇÃO 2: INFORMAÇÕES DA EMPRESA
### ═══════════════════════════════════════

**Adicionar Seção:** "2. Informações da Empresa 🏢"

**Descrição da seção:**
```
Dados básicos da empresa que aparecerão no sistema
```

---

#### Campo 2.1: Nome da Empresa
- **Tipo:** Texto curto
- **Pergunta:** Nome Completo da Empresa
- **Obrigatório:** Sim
- **Exemplo:** Clínica Saúde Mais Ltda

---

#### Campo 2.2: Nome Fantasia
- **Tipo:** Texto curto
- **Pergunta:** Nome Fantasia (se diferente do nome completo)
- **Obrigatório:** Não
- **Texto de ajuda:** Como a empresa é conhecida popularmente

---

#### Campo 2.3: CNPJ
- **Tipo:** Texto curto
- **Pergunta:** CNPJ
- **Obrigatório:** Não
- **Validação:** Expressão regular para CNPJ
- **Exemplo:** 00.000.000/0000-00

---

#### Campo 2.4: Slogan
- **Tipo:** Texto curto
- **Pergunta:** Slogan ou Frase da Marca (se houver)
- **Obrigatório:** Não
- **Exemplo:** "Cuidando da sua saúde com excelência"

---

### ═══════════════════════════════════════
### SEÇÃO 3: CONTATOS
### ═══════════════════════════════════════

**Adicionar Seção:** "3. Contatos 📞"

**Descrição da seção:**
```
Informações de contato que aparecerão no sistema, FAQ e materiais de suporte
```

---

#### Campo 3.1: E-mail de Suporte
- **Tipo:** Texto curto
- **Pergunta:** E-mail de Suporte/Atendimento
- **Obrigatório:** Sim
- **Validação:** E-mail válido
- **Texto de ajuda:** Este e-mail aparecerá no FAQ e materiais de ajuda
- **Exemplo:** suporte@suaempresa.com.br

---

#### Campo 3.2: E-mail do Sistema
- **Tipo:** Texto curto
- **Pergunta:** E-mail para envios automáticos do sistema (noreply)
- **Obrigatório:** Não
- **Validação:** E-mail válido
- **Texto de ajuda:** Recomendado: noreply@suaempresa.com.br
- **Exemplo:** noreply@suaempresa.com.br

---

#### Campo 3.3: Telefone Principal
- **Tipo:** Texto curto
- **Pergunta:** Telefone de Contato Principal
- **Obrigatório:** Sim
- **Exemplo:** (11) 3000-0000 ou (11) 90000-0000

---

#### Campo 3.4: WhatsApp
- **Tipo:** Texto curto
- **Pergunta:** WhatsApp (com DDD)
- **Obrigatório:** Não
- **Exemplo:** (11) 99999-9999

---

#### Campo 3.5: Site
- **Tipo:** Texto curto
- **Pergunta:** Site Institucional
- **Obrigatório:** Não
- **Validação:** URL
- **Exemplo:** https://www.suaempresa.com.br

---

#### Campo 3.6: Horário de Atendimento
- **Tipo:** Texto curto
- **Pergunta:** Horário de Atendimento
- **Obrigatório:** Não
- **Exemplo:** Segunda a Sexta, 8h às 18h

---

### ═══════════════════════════════════════
### SEÇÃO 4: VALORES E REGRAS DE NEGÓCIO
### ═══════════════════════════════════════

**Adicionar Seção:** "4. Valores e Regras 💰"

**Descrição da seção:**
```
Valores dos convênios e regras comerciais
```

---

#### Campo 4.1: Valor Convênio Pessoal
- **Tipo:** Texto curto
- **Pergunta:** Valor Mensal - Convênio PESSOAL (Pessoa Física)
- **Obrigatório:** Sim
- **Texto de ajuda:** Digite apenas o número. Exemplo: 100 ou 150.50
- **Exemplo:** 100

---

#### Campo 4.2: Valor Convênio Empresarial
- **Tipo:** Texto curto
- **Pergunta:** Valor Mensal - Convênio EMPRESARIAL (por pessoa)
- **Obrigatório:** Sim
- **Texto de ajuda:** Digite apenas o número
- **Exemplo:** 90

---

#### Campo 4.3: Tem Descontos?
- **Tipo:** Múltipla escolha
- **Pergunta:** Há descontos por quantidade de dependentes/funcionários?
- **Obrigatório:** Sim
- **Opções:**
  - Não, valor é fixo
  - Sim, tenho tabela de descontos
  - Sim, explicarei no próximo campo

---

#### Campo 4.4: Tabela de Descontos
- **Tipo:** Texto longo
- **Pergunta:** Descreva a tabela de descontos (se houver)
- **Obrigatório:** Não
- **Texto de ajuda:**
```
Exemplo:
- 1 a 3 pessoas: R$ 100
- 4 a 6 pessoas: R$ 90
- Acima de 10 funcionários: R$ 80
```

---

#### Campo 4.5: Máximo de Dependentes
- **Tipo:** Texto curto
- **Pergunta:** Número máximo de dependentes por convênio
- **Obrigatório:** Não
- **Texto de ajuda:** Atualmente configurado como 6. Deixe em branco se quiser manter.
- **Exemplo:** 6

---

#### Campo 4.6: Validade do Convênio
- **Tipo:** Múltipla escolha
- **Pergunta:** Período de validade do convênio
- **Obrigatório:** Sim
- **Opções:**
  - 12 meses (1 ano)
  - 6 meses
  - Outro período (especificar)

---

#### Campo 4.7: Comissão Padrão
- **Tipo:** Texto curto
- **Pergunta:** Percentual de Comissão para Vendedores (%)
- **Obrigatório:** Sim
- **Texto de ajuda:** Digite apenas o número. Exemplo: 10 (para 10%)
- **Exemplo:** 10

---

#### Campo 4.8: Comissão em Renovações
- **Tipo:** Múltipla escolha
- **Pergunta:** Vendedores recebem comissão também em renovações?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, mesmo percentual
  - Sim, mas com percentual diferente
  - Não, apenas em novos convênios

---

### ═══════════════════════════════════════
### SEÇÃO 5: PAGAMENTOS PIX
### ═══════════════════════════════════════

**Adicionar Seção:** "5. Dados de Pagamento 💳"

**Descrição da seção:**
```
Informações para recebimento de pagamentos via PIX
```

---

#### Campo 5.1: Tipo de Chave PIX
- **Tipo:** Múltipla escolha
- **Pergunta:** Qual tipo de chave PIX da empresa?
- **Obrigatório:** Sim
- **Opções:**
  - CNPJ
  - E-mail
  - Telefone
  - Chave Aleatória

---

#### Campo 5.2: Chave PIX
- **Tipo:** Texto curto
- **Pergunta:** Chave PIX
- **Obrigatório:** Sim
- **Texto de ajuda:** Digite a chave PIX completa

---

#### Campo 5.3: Nome no PIX
- **Tipo:** Texto curto
- **Pergunta:** Nome que aparece no PIX (Favorecido)
- **Obrigatório:** Sim
- **Exemplo:** CLINICA SAUDE MAIS LTDA

---

#### Campo 5.4: QR Code PIX
- **Tipo:** Upload de arquivo
- **Pergunta:** QR Code PIX (imagem)
- **Obrigatório:** Não
- **Texto de ajuda:** 
```
Envie uma imagem do QR Code em boa qualidade (PNG ou JPG).
Ou pode enviar por e-mail depois.
```
- **Tipos aceitos:** Imagens

---

#### Campo 5.5: Instruções de Pagamento
- **Tipo:** Texto longo
- **Pergunta:** Instruções ao cliente após o pagamento
- **Obrigatório:** Não
- **Texto de ajuda:**
```
O que o cliente deve fazer após efetuar o pagamento?
Exemplo: "Enviar comprovante para WhatsApp (11) 99999-9999"
```

---

### ═══════════════════════════════════════
### SEÇÃO 6: UNIDADES/FILIAIS
### ═══════════════════════════════════════

**Adicionar Seção:** "6. Unidades/Filiais 📍"

**Descrição da seção:**
```
Informações sobre as unidades de atendimento (se houver mais de uma)
```

---

#### Campo 6.1: Quantas Unidades
- **Tipo:** Múltipla escolha
- **Pergunta:** Quantas unidades/filiais a empresa possui?
- **Obrigatório:** Sim
- **Opções:**
  - Apenas 1 unidade
  - 2 unidades
  - 3 unidades
  - 4 ou mais unidades

---

#### Campo 6.2: Dados da Unidade 1
- **Tipo:** Texto longo
- **Pergunta:** UNIDADE 1 - Dados Completos
- **Obrigatório:** Sim
- **Texto de ajuda:**
```
Preencha no formato:
Nome: 
Endereço completo: 
Telefone: 
E-mail (se houver):
```

---

#### Campo 6.3: Dados da Unidade 2
- **Tipo:** Texto longo
- **Pergunta:** UNIDADE 2 - Dados Completos (se houver)
- **Obrigatório:** Não
- **Texto de ajuda:** Mesmo formato da Unidade 1

---

#### Campo 6.4: Dados da Unidade 3
- **Tipo:** Texto longo
- **Pergunta:** UNIDADE 3 - Dados Completos (se houver)
- **Obrigatório:** Não
- **Texto de ajuda:** Mesmo formato da Unidade 1

---

#### Campo 6.5: Mais Unidades
- **Tipo:** Texto longo
- **Pergunta:** Outras Unidades (4, 5, 6...)
- **Obrigatório:** Não
- **Texto de ajuda:** Liste todas as demais unidades no mesmo formato

---

### ═══════════════════════════════════════
### SEÇÃO 7: USUÁRIO ADMINISTRADOR
### ═══════════════════════════════════════

**Adicionar Seção:** "7. Acesso Administrador 👤"

**Descrição da seção:**
```
Dados da pessoa que será o administrador principal do sistema
```

---

#### Campo 7.1: Nome do Admin
- **Tipo:** Texto curto
- **Pergunta:** Nome completo do Administrador Principal
- **Obrigatório:** Sim

---

#### Campo 7.2: E-mail do Admin
- **Tipo:** Texto curto
- **Pergunta:** E-mail do Administrador
- **Obrigatório:** Sim
- **Validação:** E-mail válido
- **Texto de ajuda:** Este será o login de acesso ao sistema

---

#### Campo 7.3: Telefone do Admin
- **Tipo:** Texto curto
- **Pergunta:** Telefone/WhatsApp do Administrador
- **Obrigatório:** Sim

---

#### Campo 7.4: Outros Admins
- **Tipo:** Texto longo
- **Pergunta:** Outros Administradores (se houver)
- **Obrigatório:** Não
- **Texto de ajuda:**
```
Liste outros usuários que terão acesso de administrador:
Nome: 
E-mail:
Telefone:
```

---

### ═══════════════════════════════════════
### SEÇÃO 8: DOMÍNIO E HOSPEDAGEM
### ═══════════════════════════════════════

**Adicionar Seção:** "8. Domínio e Hospedagem 🌐"

**Descrição da seção:**
```
Informações sobre domínio e onde o sistema ficará hospedado
```

---

#### Campo 8.1: Tem Domínio
- **Tipo:** Múltipla escolha
- **Pergunta:** Vocês já possuem domínio para o sistema?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, já temos
  - Não, preciso registrar
  - Não sei, preciso de orientação

---

#### Campo 8.2: Qual Domínio
- **Tipo:** Texto curto
- **Pergunta:** Qual será o domínio do sistema?
- **Obrigatório:** Não
- **Validação:** URL
- **Texto de ajuda:**
```
Exemplos:
- sistema.suaempresa.com.br
- convenios.suaempresa.com.br
- suaempresa.com.br
```

---

#### Campo 8.3: Hospedagem
- **Tipo:** Múltipla escolha
- **Pergunta:** Sobre hospedagem do sistema
- **Obrigatório:** Sim
- **Opções:**
  - Já tenho servidor/hospedagem
  - Preciso contratar
  - Quero que você indique

---

### ═══════════════════════════════════════
### SEÇÃO 9: DOCUMENTOS
### ═══════════════════════════════════════

**Adicionar Seção:** "9. Documentos e Contratos 📄"

**Descrição da seção:**
```
Documentos legais e contratuais (se já possuir)
```

---

#### Campo 9.1: Contrato de Convênio
- **Tipo:** Múltipla escolha
- **Pergunta:** Possui modelo de Contrato de Convênio?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, enviarei por e-mail
  - Sim, segue o link
  - Não, preciso criar
  - Não sei

---

#### Campo 9.2: Termos de Uso
- **Tipo:** Múltipla escolha
- **Pergunta:** Possui Termos de Uso do sistema?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, enviarei
  - Não, preciso que você crie um modelo
  - Não é necessário

---

#### Campo 9.3: Política de Privacidade
- **Tipo:** Múltipla escolha
- **Pergunta:** Possui Política de Privacidade (LGPD)?
- **Obrigatório:** Sim
- **Opções:**
  - Sim, enviarei
  - Não, preciso que você crie um modelo
  - Não é necessário

---

#### Campo 9.4: Links para Documentos
- **Tipo:** Texto longo
- **Pergunta:** Links ou observações sobre documentos
- **Obrigatório:** Não
- **Texto de ajuda:** Se os documentos estão em Drive, Dropbox, etc.

---

### ═══════════════════════════════════════
### SEÇÃO 10: PREFERÊNCIAS
### ═══════════════════════════════════════

**Adicionar Seção:** "10. Preferências do Sistema ⚙️"

**Descrição da seção:**
```
Algumas configurações e preferências de funcionamento
```

---

#### Campo 10.1: Status Inicial
- **Tipo:** Múltipla escolha
- **Pergunta:** Quando cliente se cadastra pelo formulário público, o convênio fica:
- **Obrigatório:** Sim
- **Opções:**
  - Ativo imediatamente
  - Pendente de aprovação (recomendado)

---

#### Campo 10.2: Alerta de Vencimento
- **Tipo:** Múltipla escolha
- **Pergunta:** Quantos dias antes do vencimento deve aparecer alerta?
- **Obrigatório:** Não
- **Opções:**
  - 30 dias (padrão)
  - 15 dias
  - 45 dias
  - 60 dias

---

#### Campo 10.3: Observações Gerais
- **Tipo:** Texto longo
- **Pergunta:** Observações, dúvidas ou informações adicionais
- **Obrigatório:** Não
- **Texto de ajuda:**
```
Tem alguma necessidade específica ou dúvida? 
Alguma funcionalidade especial que precisa?
```

---

### ═══════════════════════════════════════
### SEÇÃO 11: FINALIZAÇÃO
### ═══════════════════════════════════════

**Adicionar Seção:** "11. Finalização ✅"

---

#### Campo 11.1: Prazo Desejado
- **Tipo:** Múltipla escolha
- **Pergunta:** Qual o prazo desejado para conclusão?
- **Obrigatório:** Não
- **Opções:**
  - Urgente (até 3 dias)
  - Normal (5-7 dias)
  - Sem urgência (quando possível)

---

#### Campo 11.2: Melhor Forma de Contato
- **Tipo:** Múltipla escolha
- **Pergunta:** Melhor forma de contato para dúvidas durante o processo
- **Obrigatório:** Sim
- **Opções:**
  - E-mail
  - WhatsApp
  - Telefone
  - Qualquer uma

---

#### Campo 11.3: Aceite
- **Tipo:** Caixas de seleção
- **Pergunta:** Confirmação
- **Obrigatório:** Sim
- **Opções:**
  - Confirmo que as informações fornecidas estão corretas
  - Autorizo o uso destes dados para personalização do sistema

---

**Mensagem de Conclusão:**
```
✅ Formulário enviado com sucesso!

Obrigado por preencher todas as informações. 

Vamos analisar os dados e entrar em contato em breve para:
- Confirmar informações
- Solicitar materiais pendentes (logos, documentos)
- Alinhar próximos passos

Prazo estimado após receber todos os materiais: 3-5 dias úteis.

Se tiver alguma dúvida, entre em contato:
📧 seuemail@exemplo.com
📱 (XX) XXXXX-XXXX

Atenciosamente,
[Seu Nome]
```

---

## 🎨 CONFIGURAÇÕES ADICIONAIS DO FORMS

### Configurações Gerais
1. ✅ Ativar "Exigir login" (opcional - se quiser registrar quem preencheu)
2. ✅ Ativar "Permitir edição após envio"
3. ✅ Ativar "Coletar endereço de e-mail"
4. ✅ Enviar cópia das respostas para você
5. ✅ Criar planilha de respostas automaticamente

### Aparência
1. Escolher cor do tema (use a cor da sua empresa)
2. Adicionar logo do seu escritório/empresa no header
3. Imagem de fundo (opcional)

### Notificações
1. Configurar para receber e-mail quando alguém responder
2. Configurar resumo diário de respostas

---

## 📤 COMO ENVIAR PARA O CLIENTE

### Opção 1: Link Direto
Copie o link do formulário e envie:
```
📧 Assunto: Formulário - Dados para Adaptação do Sistema

Olá [Nome do Cliente],

Para adaptar o sistema com a identidade da empresa, 
preparei um formulário completo com todas as informações necessárias.

🔗 Link do formulário: [SEU_LINK_AQUI]

⏱️ Tempo para preencher: 10-15 minutos

Podem preencher aos poucos e salvar o progresso.

Qualquer dúvida, estou à disposição!

Atenciosamente,
[Seu Nome]
```

### Opção 2: Link Encurtado
Use bit.ly ou outro encurtador para um link mais amigável

### Opção 3: QR Code
O Google Forms permite gerar QR Code automaticamente

---

## 📊 ANÁLISE DAS RESPOSTAS

Depois que o cliente preencher:

1. **Revise na planilha** do Google Sheets (criada automaticamente)
2. **Verifique campos em branco** importantes
3. **Entre em contato** para esclarecer dúvidas
4. **Solicite materiais pendentes** (logos, documentos)

---

## ✅ CHECKLIST PÓS-PREENCHIMENTO

Após receber as respostas:

- [ ] Revisar todas as respostas
- [ ] Solicitar materiais visuais (se não enviados)
- [ ] Confirmar valores e regras de negócio
- [ ] Validar chave PIX e QR Code
- [ ] Testar e-mails fornecidos
- [ ] Confirmar dados das unidades
- [ ] Agendar reunião de alinhamento (se necessário)

---

## 💡 DICAS EXTRAS

1. **Duplique o formulário** antes de enviar para ter backup
2. **Teste você mesmo** antes de enviar ao cliente
3. **Salve uma cópia das respostas** em PDF depois
4. **Use as respostas** como checklist durante a adaptação

---

**Pronto!** Agora é só criar o Google Forms seguindo este guia e enviar para o cliente! 🚀

Qualquer dúvida sobre como configurar algo específico, me avise! 😊


