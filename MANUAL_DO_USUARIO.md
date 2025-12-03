# 📖 Manual do Usuário - Sistema Mais Saúde LASAC

## Índice

1. [Introdução](#introdução)
2. [Tipos de Usuários e Permissões](#tipos-de-usuários-e-permissões)
3. [Acesso ao Sistema](#acesso-ao-sistema)
4. [Funcionalidades por Tipo de Usuário](#funcionalidades-por-tipo-de-usuário)
   - [Administrador](#administrador)
   - [Gestor](#gestor)
   - [Vendedor](#vendedor)
5. [Cadastro Público de Convênios](#cadastro-público-de-convênios)
6. [Glossário](#glossário)
7. [Suporte](#suporte)

---

## Introdução

O **Sistema Mais Saúde LASAC** é uma plataforma completa de gestão de convênios médicos, desenvolvida para facilitar o controle de pacientes, vendedores e unidades de saúde. O sistema oferece funcionalidades específicas para diferentes níveis de acesso, garantindo que cada usuário tenha as ferramentas necessárias para desempenhar suas funções.

### Principais Recursos

- 📊 **Dashboard com métricas em tempo real**
- 👥 **Gestão completa de pacientes (convênios)**
- 🏢 **Controle de unidades de saúde**
- 💼 **Gerenciamento de vendedores**
- 📈 **Relatórios detalhados e exportáveis**
- 🔐 **Sistema de autenticação seguro**
- 📱 **Interface responsiva para todos os dispositivos**

---

## Tipos de Usuários e Permissões

O sistema possui três tipos de usuários, cada um com permissões específicas:

### 1. 👑 Administrador (Admin)

**Permissões:**

- ✅ Visualizar todos os dados do sistema
- ✅ Gerenciar usuários e suas roles
- ✅ Criar, editar e excluir unidades (clínicas)
- ✅ Gerenciar vendedores de todas as unidades
- ✅ Gerenciar pacientes/convênios
- ✅ Acessar relatórios completos
- ✅ Configurações administrativas avançadas

### 2. 📋 Gestor

**Permissões:**

- ✅ Visualizar dados de sua unidade
- ✅ Gerenciar vendedores da sua unidade
- ✅ Visualizar e gerenciar pacientes/convênios da sua unidade
- ✅ Acessar relatórios da sua unidade
- ❌ Não pode gerenciar outras unidades
- ❌ Não pode alterar configurações de usuários

### 3. 💼 Vendedor (User)

**Permissões:**

- ✅ Visualizar apenas seus próprios dados
- ✅ Visualizar seus pacientes/convênios cadastrados
- ✅ Acompanhar métricas pessoais
- ✅ Gerar links de cadastro para novos convênios
- ❌ Não pode visualizar dados de outros vendedores
- ❌ Não pode gerenciar unidades

---

## Acesso ao Sistema

### Primeiro Acesso

1. Acesse o link fornecido pelo administrador do sistema
2. Na tela de login, clique em **"Criar conta"**
3. Preencha os dados solicitados:
   - Nome completo
   - E-mail válido
   - Senha (mínimo 8 caracteres)
4. Clique em **"Cadastrar"**
5. Aguarde a aprovação e configuração de permissões pelo administrador

### Login

1. Acesse a página inicial do sistema
2. Clique em **"Entrar"**
3. Digite seu e-mail e senha
4. Clique em **"Fazer login"**

### Recuperação de Senha

Se você esqueceu sua senha, entre em contato com o administrador do sistema para redefinição.

---

## Funcionalidades por Tipo de Usuário

## Administrador

### 1. 📊 Dashboard

O Dashboard é a página inicial do administrador, apresentando uma visão geral completa do sistema.

#### Métricas Principais

- **Receita Total**: Valor total gerado pelos convênios no período selecionado
- **Total de Convênios**: Quantidade total de pacientes ativos
- **Total de Vendedores**: Número de vendedores cadastrados
- **Total de Unidades**: Quantidade de clínicas/unidades cadastradas

#### Gráficos e Visualizações

- **Gráfico de Convênios**: Mostra a evolução diária de novos convênios no período
- **Top Vendedores**: Ranking dos vendedores com melhor desempenho
- **Top Unidades**: Ranking das unidades com mais convênios
- **Convênios a Vencer**: Lista de pacientes com convênio próximo do vencimento

#### Filtros de Período

No canto superior direito, você pode selecionar o período para análise:

- Clique no **ícone de calendário**
- Selecione a **data inicial** e **data final**
- Os dados serão atualizados automaticamente

---

### 2. 👥 Convênios (Pacientes)

Esta seção permite o gerenciamento completo de todos os pacientes/convênios do sistema.

#### Visualizar Convênios

A tela principal exibe uma tabela com todos os convênios cadastrados, contendo:

- Nome do paciente
- CPF
- Telefone
- Data de nascimento
- Tipo de cartão (Empresarial ou Pessoal)
- Vendedor responsável
- Unidade
- Status do convênio
- Data de vencimento
- Ações disponíveis

#### Buscar Convênios

Na barra de pesquisa, você pode buscar por:

- Nome do paciente
- CPF
- RG
- Telefone
- Cidade

A busca é inteligente e ignora acentos e espaços extras.

#### Filtros Disponíveis

1. **Filtro de Vencidos**:
   - Clique no botão **"Vencidos"** para visualizar apenas convênios expirados
2. **Filtro por Data de Vencimento**:
   - Selecione um período para filtrar convênios que vencem naquele intervalo
   - Útil para planejamento de renovações

#### Adicionar Novo Convênio

1. Clique no botão **"+ Adicionar Convênio"**
2. Preencha o formulário com os dados do paciente:

**Informações Pessoais:**

- Nome completo (obrigatório)
- CPF (obrigatório, com validação)
- RG
- Data de nascimento
- Telefone (obrigatório)

**Endereço:**

- Logradouro
- Número
- Cidade
- Estado

**Informações do Convênio:**

- Tipo de Cartão:
  - **Pessoal**: Para pessoa física
  - **Empresarial**: Para empresas
- Empresa (somente para tipo Empresarial)
- Número de cartões/dependentes
- Vendedor responsável (selecione da lista)
- Unidade (selecione da lista)

**Dependentes:**

- Adicione até 6 dependentes (se aplicável)

**Observações:**

- Campo livre para anotações importantes

3. Clique em **"Salvar"** para criar o convênio

#### Editar Convênio

1. Localize o convênio na tabela
2. Clique no **ícone de lápis** (Editar)
3. Modifique as informações necessárias
4. Clique em **"Salvar alterações"**

#### Renovar Convênio

Para convênios vencidos ou próximos do vencimento:

1. Localize o convênio na tabela
2. Clique em **"Renovar"**
3. Confirme a renovação
4. A data de vencimento será automaticamente estendida por 1 ano

#### Visualizar Carteirinha

1. Localize o convênio na tabela
2. Clique em **"Visualizar Carteirinha"**
3. Uma prévia da carteirinha será exibida
4. Clique em **"Imprimir"** para gerar o documento

#### Visualizar Contrato

1. Localize o convênio na tabela
2. Clique em **"Ver Contrato"**
3. O contrato será exibido com todos os dados preenchidos
4. Opção de impressão disponível

#### Excluir Convênio

⚠️ **Atenção**: Esta ação é irreversível!

1. Localize o convênio na tabela
2. Clique no **ícone de lixeira** (Excluir)
3. Confirme a exclusão no diálogo que aparece
4. O convênio será permanentemente removido

---

### 3. 💼 Vendedores

Gerencie todos os vendedores do sistema e acompanhe seu desempenho.

#### Visualizar Vendedores

A tela exibe cards com informações de cada vendedor:

- Foto de perfil (se disponível)
- Nome completo
- CPF
- E-mail
- Telefone
- Unidade vinculada
- Quantidade de convênios vendidos no período
- Percentual de comissão
- Chave PIX para pagamento

#### Buscar Vendedores

Use a barra de pesquisa para encontrar vendedores por:

- Nome
- CPF
- E-mail
- Telefone

#### Filtro por Período

No canto superior direito:

- Selecione o período para visualizar o desempenho dos vendedores
- Os números de convênios vendidos serão atualizados

#### Adicionar Novo Vendedor

1. Clique no botão **"+ Adicionar Vendedor"**
2. Preencha o formulário:

**Informações Pessoais:**

- Nome completo (obrigatório)
- CPF (obrigatório, com validação)
- E-mail (obrigatório)
- Telefone (obrigatório)

**Informações Profissionais:**

- Unidade vinculada (selecione da lista)
- Percentual de comissão (padrão: 10%)

**Informações de Pagamento:**

- Tipo de chave PIX:
  - CPF
  - E-mail
  - Telefone
  - Chave aleatória
- Chave PIX

**Foto de Perfil (Opcional):**

- URL da imagem do vendedor

3. Clique em **"Salvar"** para criar o vendedor

#### Editar Vendedor

1. Localize o card do vendedor
2. Clique em **"Editar"**
3. Modifique as informações necessárias
4. Clique em **"Salvar alterações"**

#### Gerar Link de Cadastro

Cada vendedor pode ter um link personalizado para cadastro de convênios:

1. Localize o card do vendedor
2. Clique em **"Gerar Link"**
3. Copie o link gerado
4. Compartilhe com o vendedor ou clientes

O link levará diretamente ao formulário de cadastro de convênio com o vendedor pré-selecionado.

#### Excluir Vendedor

⚠️ **Atenção**: Ao excluir um vendedor, seus convênios permanecerão no sistema, mas sem vendedor vinculado.

1. Localize o card do vendedor
2. Clique em **"Excluir"**
3. Confirme a exclusão
4. O vendedor será removido do sistema

---

### 4. 🏢 Unidades (Clínicas)

Gerencie as unidades de saúde do sistema.

#### Visualizar Unidades

A tela exibe cards com informações de cada unidade:

- Nome da unidade
- Data de criação
- Data da última atualização

#### Buscar Unidades

Use a barra de pesquisa para encontrar unidades pelo nome.

#### Adicionar Nova Unidade

1. Clique no botão **"+ Adicionar Unidade"**
2. Digite o nome da unidade
3. Clique em **"Salvar"**

#### Editar Unidade

1. Localize o card da unidade
2. Clique em **"Editar"**
3. Modifique o nome
4. Clique em **"Salvar alterações"**

#### Excluir Unidade

⚠️ **Atenção**: Ao excluir uma unidade, todos os vendedores e convênios vinculados também serão removidos!

1. Localize o card da unidade
2. Clique em **"Excluir"**
3. Leia o aviso e confirme a exclusão
4. A unidade e todos os dados relacionados serão removidos

---

### 5. 📈 Relatórios

Acesse relatórios detalhados para análise e tomada de decisões.

#### Relatório de Unidades

Visualize o desempenho de cada unidade no período selecionado.

**Métricas Exibidas:**

- Total de convênios novos
- Total de convênios renovados
- Total de convênios (novos + renovados)
- Total de empresas cadastradas
- Receita estimada

**Funcionalidades:**

1. **Filtro de Período**: Selecione data inicial e final
2. **Filtro por Unidade**: Visualize dados de uma unidade específica ou todas
3. **Gráfico de Evolução**: Mostra a evolução diária de convênios
4. **Tabela Detalhada**: Lista todas as unidades com suas métricas
5. **Exportar para Excel**: Baixe os dados em formato XLSX

**Como Usar:**

1. Acesse o menu **"Relatórios"**
2. Certifique-se de estar na aba **"Relatório de Unidades"**
3. Selecione o período desejado
4. (Opcional) Selecione uma unidade específica
5. Analise os dados no gráfico e tabela
6. Clique em **"Exportar Excel"** para baixar

#### Relatório de Vendedores

Acompanhe o desempenho individual de cada vendedor.

**Métricas Exibidas:**

- Nome do vendedor
- Unidade vinculada
- Total de convênios vendidos
- Total de convênios empresariais
- Comissão a receber
- Informações de pagamento (PIX)

**Funcionalidades:**

1. **Filtro de Período**: Selecione data inicial e final
2. **Filtro por Unidade**: Visualize vendedores de uma unidade específica
3. **Filtro por Vendedor**: Visualize dados de um vendedor específico
4. **Gráfico de Evolução**: Mostra vendas diárias
5. **Tabela Detalhada**: Lista todos os vendedores com métricas
6. **Exportar para Excel**: Baixe os dados em formato XLSX
7. **Cálculo Automático de Comissões**: Baseado no percentual configurado

**Como Usar:**

1. Acesse o menu **"Relatórios"**
2. Clique na aba **"Relatório de Vendedores"**
3. Selecione o período desejado
4. (Opcional) Filtre por unidade e/ou vendedor
5. Analise os dados e comissões
6. Clique em **"Exportar Excel"** para baixar

---

### 6. 🔐 Admin

Área exclusiva para gerenciamento de usuários e configurações do sistema.

#### Gerenciar Usuários

Visualize e gerencie todos os usuários do sistema.

**Informações Exibidas:**

- Nome do usuário
- E-mail
- Role (Função): Admin, Gestor ou User (Vendedor)
- Unidade vinculada (para Gestores)
- Data de criação da conta

#### Alterar Role de Usuário

Para promover ou alterar a função de um usuário:

1. Localize o usuário na lista
2. Clique em **"Alterar Role"**
3. Selecione a nova função:
   - **Admin**: Acesso total ao sistema
   - **Gestor**: Acesso limitado à sua unidade
   - **User**: Acesso de vendedor
4. Se selecionar Gestor, escolha a unidade
5. Confirme a alteração

#### Vincular Gestor a Unidade

Para gestores, é necessário vincular a uma unidade:

1. Localize o gestor na lista
2. Clique em **"Vincular Unidade"**
3. Selecione a unidade desejada
4. Confirme a vinculação

#### Buscar Usuários

Use a barra de pesquisa para encontrar usuários por:

- Nome
- E-mail

---

## Gestor

O perfil de Gestor tem acesso similar ao administrador, mas limitado à sua unidade.

### 1. 📊 Dashboard do Gestor

Visualize as métricas da sua unidade:

- Receita total da unidade
- Total de convênios da unidade
- Total de vendedores da unidade
- Gráficos de evolução
- Top vendedores da unidade
- Convênios a vencer

**Funcionalidades:**

- Filtros de período
- Visualização detalhada de métricas da unidade

### 2. 👥 Convênios da Unidade

Gerencie os convênios da sua unidade:

- Visualizar todos os convênios da unidade
- Adicionar novos convênios
- Editar convênios existentes
- Renovar convênios
- Visualizar carteirinhas e contratos
- Buscar e filtrar convênios

**Limitações:**

- Não pode visualizar convênios de outras unidades

### 3. 💼 Vendedores da Unidade

Gerencie os vendedores da sua unidade:

- Visualizar vendedores da unidade
- Adicionar novos vendedores
- Editar informações de vendedores
- Gerar links de cadastro
- Acompanhar desempenho

**Limitações:**

- Só pode gerenciar vendedores da sua unidade
- Não pode visualizar vendedores de outras unidades

### 4. 📈 Relatórios (Limitado)

Acesse relatórios da sua unidade:

- Visualizar métricas da unidade
- Exportar relatórios para Excel
- Acompanhar desempenho dos vendedores

**Limitações:**

- Relatórios restritos à sua unidade apenas

---

## Vendedor

O perfil de Vendedor é focado em acompanhamento pessoal de desempenho.

### 1. 📊 Dashboard do Vendedor

Visualize suas métricas pessoais:

- Total de convênios vendidos
- Total de convênios empresariais
- Comissão a receber
- Gráfico de evolução das suas vendas
- Lista dos seus convênios

**Funcionalidades:**

- Filtros de período para análise
- Visualização clara de comissões

### 2. 👥 Meus Convênios

Visualize todos os convênios que você cadastrou:

- Lista completa dos seus clientes
- Informações detalhadas de cada convênio
- Status dos convênios (ativo, vencido)
- Data de vencimento

**Funcionalidades:**

- Buscar convênios
- Filtrar por status
- Visualizar detalhes

**Limitações:**

- Não pode editar ou excluir convênios
- Visualiza apenas os próprios convênios

### 3. 🔗 Link de Cadastro Pessoal

Cada vendedor possui um link exclusivo para cadastro:

- Acesse sua área de vendedor
- Copie seu link personalizado
- Compartilhe com potenciais clientes
- Os convênios cadastrados através do link já vêm vinculados a você

---

## Cadastro Público de Convênios

O sistema oferece uma página pública para cadastro de convênios, acessível sem login.

### Acesso

Os clientes podem acessar de duas formas:

1. **Link geral**: `/convenio` - Cliente precisa escolher o vendedor
2. **Link do vendedor**: `/convenio/[id-do-vendedor]` - Vendedor já pré-selecionado

### Processo de Cadastro

1. **Informações Pessoais**

   - Nome completo
   - CPF (com validação)
   - Data de nascimento
   - Telefone
   - E-mail (opcional)

2. **Endereço**

   - CEP
   - Logradouro
   - Número
   - Complemento
   - Bairro
   - Cidade
   - Estado

3. **Tipo de Convênio**

   - Escolher entre Pessoal ou Empresarial
   - Se Empresarial, informar nome da empresa
   - Número de dependentes/cartões

4. **Dependentes** (se aplicável)

   - Nome de cada dependente
   - Até 6 dependentes

5. **Unidade e Vendedor**

   - Selecionar a unidade de preferência
   - Selecionar o vendedor (se não vier pré-selecionado)

6. **Informações de Pagamento**

   - Visualizar valor do convênio
   - Ver instruções de pagamento via PIX
   - QR Code disponível

7. **Finalização**
   - Aceitar termos e condições
   - Enviar cadastro
   - Receber confirmação

### Após o Cadastro

- O convênio é criado com status **"Pendente"**
- Administrador ou gestor pode aprovar/ativar
- Cliente recebe as informações por e-mail (se fornecido)

### Compatibilidade

O sistema detecta automaticamente navegadores antigos e exibe versão compatível para:

- Windows 7
- Internet Explorer
- Versões antigas de Chrome, Firefox e Safari

---

## Glossário

**Convênio**: Plano de saúde ou cartão de benefícios cadastrado no sistema para um paciente.

**Cartão Pessoal**: Convênio para pessoa física individual ou familiar.

**Cartão Empresarial**: Convênio para empresas, geralmente com múltiplos beneficiários.

**Dependente**: Pessoa adicional incluída em um convênio (cônjuge, filhos, etc).

**Unidade/Clínica**: Local físico onde os serviços de saúde são prestados.

**Vendedor**: Profissional responsável por captar e cadastrar novos convênios.

**Gestor**: Responsável pela administração de uma unidade específica.

**Renovação**: Processo de estender a validade de um convênio por mais 1 ano.

**Comissão**: Percentual do valor do convênio pago ao vendedor como remuneração.

**PIX**: Método de pagamento brasileiro instantâneo usado para comissões e pagamentos.

**Role**: Função ou nível de acesso do usuário no sistema.

---

## Navegação e Interface

### Menu Lateral (Sidebar)

O menu lateral é o principal meio de navegação:

- **Logo**: No topo, exibe o logo Mais Saúde LASAC
- **Menu Principal**: Lista de todas as páginas disponíveis para seu perfil
- **Perfil**: No rodapé, mostra seu nome e e-mail com opção de sair

### Responsividade

O sistema é totalmente responsivo:

- **Desktop**: Menu lateral fixo, visualização completa
- **Tablet**: Menu lateral colapsável
- **Mobile**: Menu em formato de drawer (gaveta), aberto por botão

### Atalhos e Dicas

- Use a **busca** em vez de rolar longas listas
- **Filtros de data** ajudam a focar em períodos específicos
- **Exportar para Excel** permite análises externas
- **Links de cadastro** facilitam o trabalho dos vendedores

---

## Melhores Práticas

### Para Administradores

1. **Configure as unidades antes de adicionar vendedores**
2. **Mantenha as informações de PIX dos vendedores atualizadas**
3. **Revise periodicamente os convênios a vencer**
4. **Use os relatórios para identificar vendedores com melhor desempenho**
5. **Mantenha backup regular dos dados exportados**

### Para Gestores

1. **Acompanhe diariamente o dashboard da sua unidade**
2. **Mantenha contato regular com seus vendedores**
3. **Monitore convênios próximos do vencimento para renovação**
4. **Use os filtros para análises específicas**

### Para Vendedores

1. **Compartilhe seu link personalizado com clientes**
2. **Acompanhe suas métricas no dashboard**
3. **Mantenha suas informações de contato atualizadas**
4. **Acompanhe o status dos seus convênios**

---

## Solução de Problemas Comuns

### Não consigo fazer login

- Verifique se seu e-mail está correto
- Confirme se a senha está correta (diferencia maiúsculas/minúsculas)
- Limpe o cache do navegador
- Entre em contato com o administrador

### Não vejo todas as funcionalidades

- Verifique seu nível de acesso (Admin, Gestor ou Vendedor)
- Cada perfil tem funcionalidades específicas
- Entre em contato com o administrador se achar que deveria ter mais acesso

### Erro ao cadastrar convênio

- Verifique se todos os campos obrigatórios estão preenchidos
- Confirme se o CPF é válido
- Verifique sua conexão com a internet
- Tente novamente em alguns minutos

### Relatórios não carregam

- Verifique sua conexão com a internet
- Tente atualizar a página (F5)
- Verifique se as datas selecionadas são válidas
- Limpe o cache do navegador

### Dados não aparecem no dashboard

- Verifique o período selecionado
- Confirme se há dados cadastrados naquele período
- Atualize a página
- Verifique se você tem as permissões necessárias

---

## Suporte

### Contato

Para suporte técnico ou dúvidas sobre o sistema:

- **E-mail**: suporte@maissaudelasac.com.br _(exemplo)_
- **Telefone**: (XX) XXXX-XXXX _(exemplo)_
- **Horário de atendimento**: Segunda a Sexta, 8h às 18h

### Solicitações Comuns

**Para Vendedores:**

- Alteração de dados cadastrais: Entre em contato com seu gestor
- Problemas com link de cadastro: Contate o suporte
- Dúvidas sobre comissões: Fale com seu gestor

**Para Gestores:**

- Adicionar novos vendedores: Use a funcionalidade no sistema
- Problemas com relatórios: Contate o suporte
- Alterações na unidade: Contate o administrador

**Para Administradores:**

- Suporte técnico avançado: suporte@maissaudelasac.com.br
- Configurações de sistema: Documentação técnica disponível

---

## Segurança e Privacidade

### Proteção de Dados

O sistema segue as melhores práticas de segurança:

- Senhas criptografadas
- Comunicação via HTTPS
- Backups regulares
- Controle de acesso por perfil

### Boas Práticas de Segurança

1. **Nunca compartilhe sua senha**
2. **Use senhas fortes** (mínimo 8 caracteres, com letras e números)
3. **Faça logout ao sair** de computadores compartilhados
4. **Mantenha seus dados atualizados**
5. **Reporte atividades suspeitas** ao administrador

### LGPD

O sistema está em conformidade com a Lei Geral de Proteção de Dados (LGPD):

- Dados pessoais são protegidos
- Acesso controlado por permissões
- Possibilidade de exclusão de dados
- Transparência no uso das informações

---

## Atualizações e Novidades

### Versão Atual

**Sistema Mais Saúde LASAC v1.0**

- Gestão completa de convênios
- Relatórios exportáveis
- Sistema de comissões
- Interface responsiva
- Compatibilidade com navegadores antigos

### Próximas Funcionalidades

_Em desenvolvimento:_

- Notificações automáticas de vencimento
- App mobile nativo
- Dashboard financeiro avançado
- Integração com sistemas de pagamento
- Assinatura digital de contratos

---

## Anexos

### Tipos de Cartão e Valores

**Cartão Pessoal:**

- Valor padrão: R$ 100,00 por titular
- Dependentes: Consultar tabela

**Cartão Empresarial:**

- Valor padrão: R$ 90,00 por funcionário
- Valores especiais para empresas maiores

_Valores podem variar - consulte o administrador_

### Fórmulas de Cálculo

**Comissão de Vendedor:**

```
Comissão = (Total de Convênios × Valor) × (Percentual / 100)
```

**Receita Total:**

```
Receita = (Convênios Pessoais × 100) + (Convênios Empresariais × 90)
```

---

## Conclusão

Este manual foi desenvolvido para auxiliar todos os usuários do Sistema Mais Saúde LASAC. Para dúvidas adicionais ou sugestões de melhoria deste documento, entre em contato com o suporte.

**Versão do Manual:** 1.0  
**Data de atualização:** Novembro de 2024  
**Desenvolvido por:** Equipe Mais Saúde LASAC

---

**© 2024 Mais Saúde LASAC - Todos os direitos reservados**


