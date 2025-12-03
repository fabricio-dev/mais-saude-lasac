# ❓ FAQ - Perguntas Frequentes | Sistema Mais Saúde LASAC

> Respostas rápidas para as dúvidas mais comuns

---

## 📋 Índice

### [🔐 Acesso e Autenticação](#acesso-e-autenticação)

### [👥 Gestão de Convênios](#gestão-de-convênios)

### [💼 Gestão de Vendedores](#gestão-de-vendedores)

### [🏢 Gestão de Unidades](#gestão-de-unidades)

### [📊 Dashboard e Relatórios](#dashboard-e-relatórios)

### [💰 Comissões e Pagamentos](#comissões-e-pagamentos)

### [🔧 Problemas Técnicos](#problemas-técnicos)

### [📱 Cadastro Público](#cadastro-público)

### [🔑 Permissões e Roles](#permissões-e-roles)

### [📈 Métricas e Análises](#métricas-e-análises)

---

## 🔐 Acesso e Autenticação

### Como faço para criar uma conta no sistema?

1. Acesse a página de login
2. Clique em **"Criar conta"**
3. Preencha nome, e-mail e senha
4. Clique em **"Cadastrar"**
5. Aguarde o administrador aprovar e configurar suas permissões

**Importante:** Toda nova conta começa como "user" (vendedor) e precisa ser configurada por um administrador.

---

### Esqueci minha senha, o que fazer?

Atualmente o sistema não possui recuperação automática de senha. Entre em contato com:

- **Vendedores:** Fale com seu gestor
- **Gestores:** Entre em contato com o administrador
- **Administradores:** Contate o suporte técnico

---

### Por que não consigo acessar certas funcionalidades?

Cada perfil tem permissões específicas:

- **Vendedor:** Vê apenas seus dados pessoais
- **Gestor:** Acessa apenas sua unidade
- **Administrador:** Tem acesso total

Verifique sua role atual ou solicite alteração ao administrador.

---

### Posso usar o mesmo e-mail em mais de uma conta?

**Não.** Cada e-mail só pode estar vinculado a uma conta. Se precisar de múltiplos acessos, use e-mails diferentes.

---

### O sistema funciona em dispositivos móveis?

**Sim!** O sistema é totalmente responsivo e funciona em:

- 📱 Smartphones
- 📱 Tablets
- 💻 Notebooks
- 🖥️ Desktops

---

### Por quanto tempo posso ficar logado?

A sessão permanece ativa enquanto você estiver usando o sistema. Por segurança, recomendamos fazer logout ao terminar, especialmente em computadores compartilhados.

---

## 👥 Gestão de Convênios

### Qual a diferença entre Cartão Pessoal e Empresarial?

| Característica        | Pessoal       | Empresarial     |
| --------------------- | ------------- | --------------- |
| **Público-alvo**      | Pessoa física | Empresas        |
| **Valor mensal**      | R$ 100,00     | R$ 90,00        |
| **Uso típico**        | Família       | Funcionários    |
| **Campo obrigatório** | -             | Nome da empresa |

---

### Como adiciono dependentes a um convênio?

1. No formulário de cadastro/edição
2. Role até a seção **"Dependentes"**
3. Preencha os nomes nos campos disponíveis
4. Máximo: 6 dependentes
5. Salve o convênio

**Dica:** O titular não conta como dependente.

---

### O que significa "Status Pendente"?

Convênios com status "Pendente" foram cadastrados via formulário público e aguardam:

- Confirmação de pagamento
- Ativação por um admin ou gestor

**Como ativar:** Edite o convênio e marque como ativo.

---

### Como renovar um convênio vencido?

**Método 1 - Rápido:**

1. Localize o convênio na lista
2. Clique no botão **"Renovar"**
3. Confirme a renovação
4. Data de vencimento é automaticamente estendida por 1 ano

**Método 2 - Manual:**

1. Edite o convênio
2. Atualize a data de vencimento manualmente
3. Salve as alterações

---

### Posso excluir um convênio?

**Sim, mas com cuidado!** A exclusão é **irreversível**.

⚠️ **Importante:**

- Todos os dados do paciente serão perdidos
- Não é possível recuperar após exclusão
- Considere apenas desativar em vez de excluir

---

### Como buscar um convênio específico?

Use a barra de busca para encontrar por:

- ✅ Nome do paciente
- ✅ CPF (com ou sem pontos/traços)
- ✅ Telefone
- ✅ RG
- ✅ Cidade

**Dica:** A busca ignora acentos e espaços extras.

---

### O que é o filtro "Vencidos"?

Mostra apenas convênios cuja **data de vencimento já passou**. Útil para:

- Identificar convênios que precisam renovação
- Planejar contato com clientes
- Análise de inadimplência

---

### Como imprimir a carteirinha?

1. Localize o convênio na lista
2. Clique no botão **"Visualizar Carteirinha"** (👁️)
3. Verifique os dados na prévia
4. Clique em **"Imprimir"**
5. Selecione sua impressora ou salve como PDF

---

### Posso editar um convênio depois de criado?

**Sim!** Admins e gestores podem editar qualquer informação, exceto:

- ⚠️ Data de criação (gerada automaticamente)
- ⚠️ Histórico de ativação (mantido pelo sistema)

---

### Quantos convênios posso cadastrar?

**Não há limite!** O sistema suporta quantidade ilimitada de convênios.

---

## 💼 Gestão de Vendedores

### Como adiciono um novo vendedor?

**Requisito:** Ser admin ou gestor

1. Acesse **"Vendedores"**
2. Clique em **"+ Adicionar Vendedor"**
3. Preencha os dados obrigatórios:
   - Nome completo
   - CPF válido
   - E-mail
   - Telefone
   - Unidade
4. Configure o percentual de comissão (padrão: 10%)
5. Informe a chave PIX para pagamentos
6. Salve

---

### O que é o "Link de Cadastro" do vendedor?

É um **link personalizado** que:

- Direciona clientes ao formulário de cadastro
- Já vem com o vendedor pré-selecionado
- Facilita o trabalho do vendedor
- Garante que os convênios sejam vinculados corretamente

**Exemplo:** `seusite.com/convenio/abc123`

---

### Como gero o link personalizado?

1. Localize o card do vendedor
2. Clique em **"Gerar Link"**
3. Copie o link exibido
4. Compartilhe com o vendedor via WhatsApp, e-mail, etc.

---

### Posso alterar o percentual de comissão?

**Sim!**

1. Edite o vendedor
2. Modifique o campo **"Percentual de comissão"**
3. Salve

**Importante:** A alteração afeta apenas comissões futuras, não retroage.

---

### O que acontece se eu excluir um vendedor?

- ❌ O vendedor é removido do sistema
- ✅ Os convênios dele **permanecem** no sistema
- ⚠️ Os convênios ficam **sem vendedor vinculado**
- ⚠️ Não é possível desfazer a exclusão

**Recomendação:** Avalie bem antes de excluir.

---

### Posso ter vendedores sem unidade?

**Não.** Todo vendedor precisa estar vinculado a uma unidade. Isso é necessário para:

- Organização dos dados
- Relatórios por unidade
- Controle de acesso de gestores

---

### Como atualizo a chave PIX de um vendedor?

1. Edite o vendedor
2. Na seção **"Informações de Pagamento"**:
   - Selecione o tipo de chave (CPF, E-mail, Telefone, Aleatória)
   - Digite a nova chave
3. Salve

---

### Vendedores podem ver dados de outros vendedores?

**Não.** Vendedores veem apenas:

- Seus próprios convênios
- Suas próprias métricas
- Suas comissões pessoais

---

## 🏢 Gestão de Unidades

### O que é uma "Unidade"?

É uma clínica, posto de atendimento ou filial onde os serviços de saúde são prestados. Serve para:

- Organizar vendedores por localização
- Gerar relatórios por unidade
- Controlar acesso de gestores

---

### Quantas unidades posso criar?

**Ilimitadas!** Crie quantas unidades precisar.

---

### Posso transferir um vendedor de unidade?

**Sim!**

1. Edite o vendedor
2. Selecione a nova unidade no dropdown
3. Salve

Os convênios dele são automaticamente vinculados à nova unidade.

---

### O que acontece ao excluir uma unidade?

⚠️ **ATENÇÃO - AÇÃO CRÍTICA:**

Ao excluir uma unidade, **TUDO vinculado a ela é excluído**:

- ❌ Todos os vendedores da unidade
- ❌ Todos os convênios da unidade
- ❌ Vínculos com gestores

**Esta ação é IRREVERSÍVEL!**

---

### Como edito o nome de uma unidade?

1. Localize o card da unidade
2. Clique em **"Editar"**
3. Digite o novo nome
4. Salve

---

### Posso ter duas unidades com o mesmo nome?

**Tecnicamente sim**, mas **não é recomendado** para evitar confusão. Use nomes únicos e descritivos:

- ✅ "Unidade Centro - São Paulo"
- ✅ "Clínica Norte - Rio de Janeiro"
- ❌ "Unidade 1" (pouco descritivo)

---

## 📊 Dashboard e Relatórios

### Como altero o período do dashboard?

1. Clique no **ícone de calendário** (geralmente no canto superior direito)
2. Selecione a **data inicial**
3. Selecione a **data final**
4. Confirme
5. O dashboard atualiza automaticamente

---

### O que significa "Receita Total"?

É o valor total estimado dos convênios no período, calculado como:

```
Receita = (Convênios Pessoais × R$ 100) + (Convênios Empresariais × R$ 90)
```

**Nota:** Valores podem variar conforme configuração da sua instalação.

---

### Por que meu dashboard está vazio?

Possíveis causas:

1. **Período sem dados:** Selecione um período com atividade
2. **Sem convênios cadastrados:** Cadastre convênios primeiro
3. **Permissões limitadas:** Vendedores veem apenas seus dados
4. **Problema de conexão:** Atualize a página (F5)

---

### Como exporto um relatório?

1. Acesse **"Relatórios"**
2. Escolha a aba (Unidades ou Vendedores)
3. Configure os filtros (período, unidade, vendedor)
4. Clique em **"Exportar Excel"**
5. O arquivo .xlsx será baixado automaticamente

---

### O que contém o arquivo exportado?

**Relatório de Unidades:**

- Nome da unidade
- Total de convênios novos
- Total de renovações
- Total geral
- Número de empresas
- Receita estimada

**Relatório de Vendedores:**

- Nome do vendedor
- Unidade
- Total de convênios
- Total de empresariais
- Comissão calculada
- Dados PIX para pagamento

---

### Por que os números do relatório não batem com o dashboard?

Verifique:

- ✅ Se os **períodos selecionados** são os mesmos
- ✅ Se os **filtros aplicados** são idênticos
- ✅ Se houve **cadastros novos** entre as visualizações

Se mesmo assim houver divergência, contate o suporte.

---

### Posso agendar relatórios automáticos?

**Atualmente não.** Esta funcionalidade está planejada para versões futuras.

---

## 💰 Comissões e Pagamentos

### Como são calculadas as comissões?

```
Comissão = (Total de Convênios × Valor do Convênio) × (Percentual / 100)
```

**Exemplo:**

- Vendedor: 10 convênios pessoais
- Valor: R$ 100 por convênio
- Percentual: 10%
- **Comissão = (10 × 100) × 0,10 = R$ 100,00**

---

### Comissões incluem renovações?

**Sim!** O sistema conta tanto:

- ✅ Convênios novos (activeAt no período)
- ✅ Renovações (reactivatedAt no período)

---

### Como altero o percentual de comissão de um vendedor?

1. Edite o vendedor
2. Modifique o campo **"Percentual de comissão"**
3. Salve

**Importante:** Não afeta comissões já calculadas, apenas futuras.

---

### Onde vejo as informações de PIX para pagamento?

**No Relatório de Vendedores:**

1. Acesse **"Relatórios"** → **"Vendedores"**
2. Configure o período
3. A tabela mostra:
   - Tipo de chave PIX
   - Chave PIX
   - Valor da comissão

**Dica:** Exporte para Excel para facilitar o processamento de pagamentos.

---

### Posso usar diferentes percentuais para diferentes vendedores?

**Sim!** Cada vendedor pode ter seu próprio percentual de comissão configurado individualmente.

---

### O sistema processa pagamentos automaticamente?

**Não.** O sistema apenas **calcula e informa** os valores. O pagamento deve ser processado manualmente pelo admin/gestor usando as informações de PIX fornecidas.

---

## 🔧 Problemas Técnicos

### A página não carrega, o que fazer?

**Checklist:**

1. ✅ Verifique sua conexão com a internet
2. ✅ Atualize a página (F5 ou Ctrl+R)
3. ✅ Limpe o cache do navegador
4. ✅ Tente em modo anônimo/privado
5. ✅ Teste em outro navegador
6. ✅ Entre em contato com o suporte

---

### Recebi um erro ao salvar, por quê?

**Causas comuns:**

1. **Campos obrigatórios vazios**

   - Solução: Preencha todos os campos marcados como obrigatórios

2. **CPF inválido**

   - Solução: Verifique se o CPF está correto e completo

3. **E-mail já cadastrado**

   - Solução: Use outro e-mail ou recupere a conta existente

4. **Problema de conexão**
   - Solução: Verifique internet e tente novamente

---

### O sistema está lento, é normal?

**Depende:**

- ✅ Normal: Primeira carga do dia (cache vazio)
- ✅ Normal: Exportação de relatórios grandes
- ❌ Anormal: Lentidão constante

Se a lentidão persistir:

- Limpe o cache do navegador
- Verifique sua conexão
- Contate o suporte técnico

---

### Não consigo fazer upload de foto do vendedor

O sistema aceita **URLs de imagens**, não upload direto.

**Como fazer:**

1. Hospede a imagem em um serviço (Google Drive, Imgur, etc.)
2. Obtenha o link direto da imagem
3. Cole o link no campo "URL da Foto"

---

### Os dados sumiram do dashboard!

**Não se preocupe!** Provavelmente é o período selecionado.

1. Verifique o período no calendário
2. Selecione um período maior ou mais recente
3. Os dados devem reaparecer

Se não resolver, contate o suporte imediatamente.

---

### Recebi "Erro 403 - Acesso Negado"

Você está tentando acessar uma página sem permissão:

- **Vendedor** tentando acessar área de Admin
- **Gestor** tentando ver outras unidades
- Conta sem role configurada corretamente

**Solução:** Entre em contato com o administrador para verificar suas permissões.

---

## 📱 Cadastro Público

### Qualquer pessoa pode se cadastrar pelo link público?

**Sim!** O link `/convenio` é público e pode ser acessado por qualquer pessoa sem login.

---

### O cadastro público é seguro?

**Sim!** O sistema:

- ✅ Valida CPF
- ✅ Protege contra dados duplicados
- ✅ Cria convênios com status "Pendente" para aprovação
- ✅ Usa conexão HTTPS criptografada

---

### O cliente precisa criar uma conta?

**Não!** O formulário público não requer:

- ❌ Login
- ❌ Senha
- ❌ Conta de usuário

Apenas preenchimento do formulário.

---

### Como aprovo um cadastro público?

1. Acesse **"Convênios"**
2. Busque por convênios com status **"Pendente"**
3. Edite o convênio
4. Marque como **"Ativo"**
5. Salve

O convênio está aprovado!

---

### Posso personalizar o formulário público?

**Atualmente não.** Os campos são fixos. Funcionalidade de customização está planejada para o futuro.

---

### O cliente recebe confirmação por e-mail?

**Depende da configuração.** Se o cliente forneceu e-mail válido, o sistema pode enviar confirmação (se configurado).

---

### Link de vendedor expira?

**Não!** Os links personalizados dos vendedores são permanentes e podem ser usados indefinidamente.

---

## 🔑 Permissões e Roles

### Quais são os níveis de acesso?

| Role                | Nível  | Acesso                 |
| ------------------- | ------ | ---------------------- |
| **Admin**           | 🌟🌟🌟 | Total - todas unidades |
| **Gestor**          | 🌟🌟   | Limitado - sua unidade |
| **User (Vendedor)** | 🌟     | Restrito - seus dados  |

---

### Como solicito upgrade para Admin?

**Não é automático.** Apenas um administrador atual pode promover outros usuários. Entre em contato com:

- Administrador do sistema
- Gerente responsável
- Suporte técnico (em casos especiais)

---

### Posso ter múltiplas roles?

**Não.** Cada usuário tem apenas UMA role ativa por vez. Se precisar de acessos diferentes, crie contas separadas com e-mails diferentes.

---

### Como um Gestor é vinculado a uma unidade?

1. Admin acessa **"Admin"** → **"Gerenciar Usuários"**
2. Localiza o usuário
3. Clica em **"Alterar Role"**
4. Seleciona **"Gestor"**
5. Escolhe a unidade
6. Confirma

---

### Gestor pode ver dados de outras unidades?

**Não.** Gestores veem APENAS:

- Sua unidade
- Vendedores da sua unidade
- Convênios da sua unidade

---

### Vendedor pode se tornar Gestor?

**Sim!** Um admin pode promover qualquer usuário:

Vendedor → Gestor → Admin

---

## 📈 Métricas e Análises

### O que são "Convênios a Vencer"?

São convênios cuja data de vencimento está **próxima** (geralmente 30 dias). Serve para:

- 📞 Planejar contato com clientes
- 💰 Preparar renovações
- 📊 Prever receita futura

---

### Como é definido "Top Vendedores"?

Ranking baseado no **total de convênios** (novos + renovados) no período selecionado. Ordem decrescente.

---

### A receita é real ou estimada?

**Estimada.** O sistema calcula com base nos convênios ativos, mas não rastreia pagamentos reais. É uma projeção.

---

### Posso comparar períodos diferentes?

**Não diretamente.** Você precisa:

1. Configurar período 1 → Exportar relatório
2. Configurar período 2 → Exportar relatório
3. Comparar manualmente no Excel

---

### As métricas são em tempo real?

**Sim!** Os dados são atualizados a cada ação:

- Novo convênio → Atualiza métricas imediatamente
- Renovação → Reflete instantaneamente
- Exclusão → Remove dos cálculos na hora

---

## 🎓 Dicas e Boas Práticas

### Como organizo melhor meus convênios?

**Use os filtros:**

- 📅 Filtro de período para análise temporal
- 🔴 Filtro de vencidos para ações urgentes
- 🔍 Busca para localizar clientes específicos
- 📊 Exporte para análises externas

---

### Qual a melhor prática para renovações?

**Proatividade:**

1. Acompanhe "Convênios a Vencer" semanalmente
2. Entre em contato 30 dias antes do vencimento
3. Renove assim que confirmado
4. Mantenha histórico de contatos nas observações

---

### Como evito duplicar cadastros?

**Antes de cadastrar:**

1. 🔍 Busque pelo CPF do cliente
2. ✅ Confirme que não existe cadastro
3. ➕ Só então crie novo convênio

---

### Devo usar observações nos convênios?

**Sim!** Use para:

- 📝 Anotar particularidades do cliente
- 📞 Registrar histórico de contatos
- ⚠️ Marcar pendências
- 💬 Comunicar com a equipe

---

### Com que frequência devo exportar relatórios?

**Recomendado:**

- 📅 **Semanal:** Para acompanhamento de metas
- 📆 **Mensal:** Para fechamento e pagamentos
- 📊 **Trimestral:** Para análises estratégicas

---

## 🆘 Suporte e Contato

### Como entro em contato com o suporte?

**E-mail:** suporte@maissaudelasac.com.br  
**Telefone:** (XX) XXXX-XXXX  
**Horário:** Segunda a Sexta, 8h às 18h

---

### Quanto tempo demora o suporte?

**Prioridades:**

- 🔴 **Urgente** (sistema fora do ar): 1-2 horas
- 🟡 **Normal** (problemas de uso): 24 horas
- 🟢 **Baixa** (dúvidas e sugestões): 48 horas

---

### Posso sugerir melhorias?

**Sim, por favor!** Adoramos feedback. Envie para:

- E-mail do suporte
- Seu gestor/administrador
- Formulário de sugestões (se disponível)

---

### Onde encontro atualizações do sistema?

- 📧 E-mail de notificações
- 📢 Avisos no próprio sistema
- 📄 Seção "Atualizações" no manual

---

### O sistema tem treinamento?

Entre em contato com o suporte para verificar disponibilidade de:

- 🎥 Vídeos tutoriais
- 📚 Sessões de treinamento
- 📖 Material complementar

---

## 📚 Recursos Adicionais

### Onde encontro mais informações?

- **📖 Manual Completo:** `MANUAL_DO_USUARIO.md`
- **🚀 Guia Rápido:** `GUIA_RAPIDO.md`
- **📊 Fluxos de Trabalho:** `FLUXOS_DE_TRABALHO.md`
- **📸 Guia de Capturas:** `GUIA_CAPTURAS_DE_TELA.md`
- **❓ FAQ:** Este documento

---

### Existe versão em PDF?

Você pode converter qualquer documento Markdown para PDF usando:

- **Pandoc** (linha de comando)
- **Markdown to PDF** (extensão do VS Code)
- **Dillinger.io** (online)

---

### Preciso de internet para usar?

**Sim.** O sistema é web-based e requer conexão com internet ativa.

---

## 🔄 Histórico de Perguntas

**Última atualização:** Novembro 2024  
**Versão do FAQ:** 1.0  
**Total de perguntas:** 100+

---

## 💬 Sua dúvida não está aqui?

1. 🔍 Use Ctrl+F para buscar palavras-chave
2. 📖 Consulte o Manual Completo
3. 📧 Entre em contato com o suporte
4. 💡 Sua pergunta pode virar uma nova entrada no FAQ!

---

**📌 Lembre-se:** Não há pergunta boba. Estamos aqui para ajudar!

---

**Sistema Mais Saúde LASAC** | © 2024 Todos os direitos reservados


