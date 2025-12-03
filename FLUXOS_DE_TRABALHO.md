# 📊 Diagramas de Fluxo - Sistema Mais Saúde LASAC

> Visualização dos principais fluxos de trabalho do sistema

---

## 📋 Índice

1. [Fluxo de Autenticação e Acesso](#1-fluxo-de-autenticação-e-acesso)
2. [Fluxo de Cadastro de Convênio (Admin/Gestor)](#2-fluxo-de-cadastro-de-convênio-admingestor)
3. [Fluxo de Cadastro Público](#3-fluxo-de-cadastro-público)
4. [Fluxo de Renovação de Convênio](#4-fluxo-de-renovação-de-convênio)
5. [Fluxo de Cadastro de Vendedor](#5-fluxo-de-cadastro-de-vendedor)
6. [Fluxo de Geração de Relatórios](#6-fluxo-de-geração-de-relatórios)
7. [Fluxo de Gerenciamento de Usuários (Admin)](#7-fluxo-de-gerenciamento-de-usuários-admin)
8. [Hierarquia de Permissões](#8-hierarquia-de-permissões)
9. [Relacionamento entre Entidades](#9-relacionamento-entre-entidades)

---

## 1. Fluxo de Autenticação e Acesso

### Diagrama: Processo de Login e Redirecionamento

```mermaid
flowchart TD
    A[Usuário acessa o sistema] --> B{Possui conta?}
    B -->|Não| C[Clica em Criar Conta]
    B -->|Sim| D[Insere e-mail e senha]

    C --> E[Preenche formulário de cadastro]
    E --> F[Sistema cria conta como 'user']
    F --> G[Aguarda aprovação do Admin]
    G --> H[Admin atribui role e unidade]
    H --> I[Usuário pode fazer login]

    D --> J{Credenciais válidas?}
    J -->|Não| K[Exibe erro]
    K --> D
    J -->|Sim| L[Autentica usuário]

    L --> M{Qual é a role?}
    M -->|Admin| N[Redireciona para /dashboard]
    M -->|Gestor| O[Redireciona para /gerente/dashboard-gestor]
    M -->|User Vendedor| P[Redireciona para /vendedor/dashboard-seller]

    N --> Q[Dashboard Admin]
    O --> R[Dashboard Gestor]
    P --> S[Dashboard Vendedor]

    style A fill:#e1f5ff
    style Q fill:#d4edda
    style R fill:#d4edda
    style S fill:#d4edda
    style K fill:#f8d7da
```

---

## 2. Fluxo de Cadastro de Convênio (Admin/Gestor)

### Diagrama: Cadastro Manual de Convênio

```mermaid
flowchart TD
    A[Admin/Gestor acessa /patients] --> B[Clica em + Adicionar Convênio]
    B --> C[Preenche Informações Pessoais]
    C --> D[Nome, CPF, RG, Data Nasc., Telefone]

    D --> E[Preenche Endereço]
    E --> F[Logradouro, Número, Cidade, Estado]

    F --> G{Tipo de Cartão?}
    G -->|Pessoal| H[Valor: R$ 100/mês]
    G -->|Empresarial| I[Preenche nome da Empresa]
    I --> J[Valor: R$ 90/mês]

    H --> K[Define número de dependentes]
    J --> K
    K --> L[Adiciona nomes dos dependentes se houver]

    L --> M[Seleciona Vendedor]
    M --> N[Seleciona Unidade]
    N --> O[Adiciona Observações opcional]

    O --> P{Validação dos campos}
    P -->|Campos inválidos| Q[Exibe erros]
    Q --> C
    P -->|Tudo OK| R[Clica em Salvar]

    R --> S[Sistema cria convênio]
    S --> T[Define data de vencimento = hoje + 1 ano]
    T --> U[Define isActive = true]
    U --> V[Salva activeAt = data atual]

    V --> W[Exibe mensagem de sucesso]
    W --> X[Convênio aparece na lista]

    style A fill:#e1f5ff
    style W fill:#d4edda
    style Q fill:#f8d7da
```

---

## 3. Fluxo de Cadastro Público

### Diagrama: Cliente cadastrando via link público

```mermaid
flowchart TD
    A[Cliente acessa /convenio] --> B{Link tem ID do vendedor?}
    B -->|Sim| C[Vendedor pré-selecionado]
    B -->|Não| D[Cliente deve escolher vendedor]

    C --> E[Preenche dados pessoais]
    D --> E
    E --> F[Nome, CPF, Data Nasc., Telefone, E-mail]

    F --> G[Preenche endereço completo]
    G --> H[CEP, Logradouro, Número, Cidade, Estado]

    H --> I{Tipo de convênio?}
    I -->|Pessoal| J[Mostra valor R$ 100]
    I -->|Empresarial| K[Informa nome da empresa]
    K --> L[Mostra valor R$ 90]

    J --> M[Define quantidade de dependentes]
    L --> M
    M --> N[Preenche nomes dos dependentes]

    N --> O[Seleciona Unidade de preferência]
    O --> P{Vendedor já selecionado?}
    P -->|Não| Q[Seleciona Vendedor]
    P -->|Sim| R[Continua]
    Q --> R

    R --> S[Visualiza informações de pagamento]
    S --> T[QR Code PIX e instruções]
    T --> U[Aceita termos e condições]

    U --> V{Validação completa?}
    V -->|Erro| W[Mostra campos com erro]
    W --> E
    V -->|OK| X[Envia cadastro]

    X --> Y[Sistema cria convênio]
    Y --> Z[statusAgreement = 'pending']
    Z --> AA[isActive = false]

    AA --> AB[Exibe mensagem de confirmação]
    AB --> AC[Informa próximos passos]
    AC --> AD[Admin/Gestor precisa ativar]

    style A fill:#e1f5ff
    style AB fill:#d4edda
    style W fill:#f8d7da
    style AD fill:#fff3cd
```

---

## 4. Fluxo de Renovação de Convênio

### Diagrama: Processo de Renovação

```mermaid
flowchart TD
    A[Admin/Gestor visualiza convênios] --> B{Convênio vencido?}
    B -->|Sim| C[Aparece no filtro Vencidos]
    B -->|Próximo de vencer| D[Aparece em Convênios a Vencer]

    C --> E[Usuário localiza o convênio]
    D --> E

    E --> F[Clica no botão Renovar]
    F --> G[Sistema exibe modal de confirmação]
    G --> H{Usuário confirma?}

    H -->|Não| I[Cancela operação]
    I --> E
    H -->|Sim| J[Sistema processa renovação]

    J --> K[Calcula nova data de vencimento]
    K --> L[expirationDate = data atual + 1 ano]
    L --> M[Atualiza reactivatedAt = agora]
    M --> N[Mantém isActive = true]

    N --> O[Salva alterações no banco]
    O --> P[Exibe mensagem de sucesso]
    P --> Q[Convênio renovado]
    Q --> R[Remove do filtro de vencidos]

    style A fill:#e1f5ff
    style P fill:#d4edda
    style R fill:#d4edda
```

---

## 5. Fluxo de Cadastro de Vendedor

### Diagrama: Admin/Gestor cadastrando vendedor

```mermaid
flowchart TD
    A[Admin/Gestor acessa /sellers] --> B[Clica em + Adicionar Vendedor]
    B --> C[Preenche dados pessoais]
    C --> D[Nome, CPF, E-mail, Telefone]

    D --> E[Seleciona Unidade]
    E --> F[Define percentual de comissão]
    F --> G[Padrão: 10%]

    G --> H[Configura informações de pagamento]
    H --> I{Tipo de chave PIX?}
    I -->|CPF| J[Usa CPF como chave]
    I -->|E-mail| K[Usa e-mail como chave]
    I -->|Telefone| L[Usa telefone como chave]
    I -->|Chave aleatória| M[Insere chave manualmente]

    J --> N[Insere chave PIX]
    K --> N
    L --> N
    M --> N

    N --> O[Opcional: URL da foto]
    O --> P{Validação dos campos}

    P -->|CPF inválido| Q[Exibe erro]
    P -->|E-mail inválido| Q
    P -->|Campos vazios| Q
    Q --> C

    P -->|Tudo OK| R[Clica em Salvar]
    R --> S[Sistema cria vendedor]
    S --> T[Vincula à unidade selecionada]
    T --> U[Salva no banco de dados]

    U --> V[Exibe mensagem de sucesso]
    V --> W[Vendedor aparece na lista]
    W --> X[Pode gerar link de cadastro]

    style A fill:#e1f5ff
    style V fill:#d4edda
    style Q fill:#f8d7da
```

---

## 6. Fluxo de Geração de Relatórios

### Diagrama: Exportação de Relatórios

```mermaid
flowchart TD
    A[Admin/Gestor acessa /management] --> B{Qual relatório?}
    B -->|Unidades| C[Aba Relatório de Unidades]
    B -->|Vendedores| D[Aba Relatório de Vendedores]

    C --> E[Seleciona período inicial e final]
    D --> E

    E --> F{Quer filtrar?}
    F -->|Sim| G[Seleciona unidade específica]
    F -->|Não| H[Visualiza todas]

    G --> I[Sistema filtra dados]
    H --> I

    I --> J[Exibe métricas em cards]
    J --> K[Total de convênios, Renovados, Receita]
    K --> L[Mostra gráfico de evolução]
    L --> M[Apresenta tabela detalhada]

    M --> N{Quer exportar?}
    N -->|Não| O[Continua analisando]
    O --> E

    N -->|Sim| P[Clica em Exportar Excel]
    P --> Q[Sistema gera arquivo XLSX]
    Q --> R[Inclui todos os dados filtrados]
    R --> S[Adiciona cabeçalhos e formatação]
    S --> T[Calcula totais e subtotais]

    T --> U[Download inicia automaticamente]
    U --> V[Arquivo salvo no computador]
    V --> W[Pronto para análise externa]

    style A fill:#e1f5ff
    style V fill:#d4edda
```

---

## 7. Fluxo de Gerenciamento de Usuários (Admin)

### Diagrama: Admin alterando role de usuário

```mermaid
flowchart TD
    A[Admin acessa /admin] --> B[Visualiza lista de usuários]
    B --> C[Localiza usuário]
    C --> D[Verifica role atual]

    D --> E{O que fazer?}
    E -->|Alterar role| F[Clica em Alterar Role]
    E -->|Vincular unidade| G[Clica em Vincular Unidade]
    E -->|Buscar| H[Usa barra de busca]

    F --> I[Modal de alteração abre]
    I --> J{Seleciona nova role}

    J -->|Admin| K[Concede acesso total]
    J -->|Gestor| L[Seleciona unidade]
    J -->|User| M[Define como vendedor]

    K --> N[Confirma alteração]
    L --> O[Vincula à unidade]
    O --> N
    M --> N

    N --> P[Sistema atualiza role]
    P --> Q{Role = Gestor?}
    Q -->|Sim| R[Cria relação usersToClinics]
    Q -->|Não| S[Apenas atualiza role]

    R --> T[Usuário vinculado à unidade]
    S --> T
    T --> U[Salva no banco de dados]
    U --> V[Exibe mensagem de sucesso]
    V --> W[Lista atualizada]

    W --> X[Usuário vê mudanças no próximo login]
    X --> Y[Redirecionado para dashboard correto]

    G --> Z[Modal de seleção de unidade]
    Z --> AA[Escolhe unidade]
    AA --> R

    H --> AB[Filtra resultados]
    AB --> C

    style A fill:#e1f5ff
    style V fill:#d4edda
```

---

## 8. Hierarquia de Permissões

### Diagrama: Pirâmide de Acesso

```
                    👑 ADMINISTRADOR
                   /       |        \
                  /        |         \
           TODAS AS      TODOS      TODAS
           UNIDADES   VENDEDORES   FUNÇÕES
                 \        |        /
                  \       |       /
                   \      |      /
                    📋 GESTOR
                   /      |      \
                  /       |       \
            SUA UNIDADE  SEUS    FUNÇÕES
                        VENDEDORES LIMITADAS
                         \    |    /
                          \   |   /
                           \  |  /
                        💼 VENDEDOR
                           /   \
                          /     \
                    SEUS DADOS  SUAS
                              COMISSÕES
```

### Diagrama Mermaid: Estrutura de Permissões

```mermaid
graph TD
    A[Sistema Mais Saúde LASAC] --> B[Admin]
    A --> C[Gestor]
    A --> D[Vendedor]

    B --> B1[Gerenciar Usuários]
    B --> B2[Todas Unidades]
    B --> B3[Todos Vendedores]
    B --> B4[Todos Convênios]
    B --> B5[Relatórios Completos]
    B --> B6[Configurações]

    C --> C1[Ver Sua Unidade]
    C --> C2[Gerenciar Vendedores da Unidade]
    C --> C3[Convênios da Unidade]
    C --> C4[Relatórios da Unidade]

    D --> D1[Ver Seus Dados]
    D --> D2[Seus Convênios]
    D --> D3[Suas Comissões]
    D --> D4[Gerar Link Pessoal]

    style B fill:#ff6b6b
    style C fill:#4ecdc4
    style D fill:#95e1d3
```

---

## 9. Relacionamento entre Entidades

### Diagrama: Estrutura do Banco de Dados

```mermaid
erDiagram
    USERS ||--o{ USERS_TO_CLINICS : "tem"
    CLINICS ||--o{ USERS_TO_CLINICS : "vincula"
    CLINICS ||--o{ SELLERS : "possui"
    CLINICS ||--o{ PATIENTS : "atende"
    SELLERS ||--o{ PATIENTS : "vende"

    USERS {
        string id PK
        string name
        string email
        string role
        boolean banned
        timestamp createdAt
    }

    CLINICS {
        uuid id PK
        string name
        timestamp createdAt
        timestamp updatedAt
    }

    SELLERS {
        uuid id PK
        string name
        string cpfNumber
        string phoneNumber
        string email
        int percentage
        string pixKey
        string pixKeyType
        uuid clinicId FK
    }

    PATIENTS {
        uuid id PK
        string name
        string cpfNumber
        string phoneNumber
        date birthDate
        enum cardType
        string Enterprise
        int numberCards
        timestamp expirationDate
        enum statusAgreement
        boolean isActive
        timestamp activeAt
        timestamp reactivatedAt
        uuid sellerId FK
        uuid clinicId FK
    }

    USERS_TO_CLINICS {
        string userId FK
        uuid clinicId FK
        timestamp createdAt
    }
```

---

## 10. Fluxo de Dados no Dashboard

### Diagrama: Carregamento do Dashboard

```mermaid
flowchart LR
    A[Usuário acessa Dashboard] --> B{Verifica role}
    B -->|Admin| C[getDashboard]
    B -->|Gestor| D[getDashboardGestor]
    B -->|Vendedor| E[getDashboardSeller]

    C --> F[Busca TODAS unidades do admin]
    D --> G[Busca SUA unidade]
    E --> H[Busca SEUS dados]

    F --> I[Filtra por período selecionado]
    G --> I
    H --> I

    I --> J[Calcula métricas]
    J --> K[Total de Convênios]
    J --> L[Total de Vendedores]
    J --> M[Total de Unidades]
    J --> N[Receita Total]

    K --> O[Agrupa dados diários]
    L --> O
    M --> O
    N --> O

    O --> P[Gera dados para gráfico]
    P --> Q[Identifica Top Vendedores]
    Q --> R[Identifica Top Unidades]
    R --> S[Lista Convênios a Vencer]

    S --> T[Retorna JSON para frontend]
    T --> U[Renderiza Dashboard]
    U --> V[Exibe métricas e gráficos]

    style A fill:#e1f5ff
    style V fill:#d4edda
```

---

## 11. Fluxo de Busca e Filtros

### Diagrama: Sistema de Busca Inteligente

```mermaid
flowchart TD
    A[Usuário digita na busca] --> B[Captura termo de busca]
    B --> C[Normaliza texto]
    C --> D[Remove acentos]
    C --> E[Normaliza espaços múltiplos]
    C --> F[Converte para minúsculas]

    D --> G[Cria consulta SQL]
    E --> G
    F --> G

    G --> H[Busca em múltiplos campos]
    H --> I[Nome - ILIKE]
    H --> J[CPF - ILIKE]
    H --> K[Telefone - ILIKE]
    H --> L[Cidade - ILIKE]
    H --> M[RG - ILIKE]

    I --> N[Combina resultados com OR]
    J --> N
    K --> N
    L --> N
    M --> N

    N --> O[Aplica filtros adicionais]
    O --> P{Filtro de vencidos?}
    P -->|Sim| Q[WHERE expirationDate <= hoje]
    P -->|Não| R[Sem filtro adicional]

    Q --> S{Filtro de período?}
    R --> S
    S -->|Sim| T[WHERE expirationDate BETWEEN datas]
    S -->|Não| U[Sem filtro de período]

    T --> V[Executa query no banco]
    U --> V
    V --> W[Retorna resultados]
    W --> X[Ordena por relevância]
    X --> Y[Exibe na interface]

    style A fill:#e1f5ff
    style Y fill:#d4edda
```

---

## 12. Ciclo de Vida de um Convênio

### Diagrama: Estados do Convênio

```mermaid
stateDiagram-v2
    [*] --> Pendente: Cadastro Público
    [*] --> Ativo: Cadastro Admin/Gestor

    Pendente --> Ativo: Admin/Gestor ativa
    Pendente --> Cancelado: Não aprovado

    Ativo --> AVencer: 30 dias antes do vencimento
    AVencer --> Vencido: Data de vencimento passa
    AVencer --> Renovado: Renovação antecipada

    Vencido --> Renovado: Processo de renovação
    Vencido --> Inativo: Não renovado após 90 dias

    Renovado --> AVencer: 11 meses depois

    Inativo --> Reativado: Admin reativa
    Reativado --> Ativo: Processo completo

    Cancelado --> [*]: Excluído do sistema

    note right of Pendente
        statusAgreement = 'pending'
        isActive = false
    end note

    note right of Ativo
        isActive = true
        activeAt = data de ativação
    end note

    note right of Vencido
        expirationDate < hoje
        statusAgreement = 'expired'
    end note

    note right of Renovado
        reactivatedAt = data renovação
        expirationDate = +1 ano
    end note
```

---

## 13. Fluxo de Comissões

### Diagrama: Cálculo de Comissões

```mermaid
flowchart TD
    A[Sistema calcula comissões] --> B[Filtra por período selecionado]
    B --> C[Para cada vendedor]

    C --> D[Conta convênios Pessoais ativos]
    C --> E[Conta convênios Empresariais ativos]

    D --> F[Filtra por activeAt no período]
    E --> G[Filtra por activeAt no período]

    F --> H[Adiciona renovados no período]
    G --> I[Adiciona renovados no período]

    H --> J[Filtra por reactivatedAt no período]
    I --> K[Filtra por reactivatedAt no período]

    J --> L[Total Pessoais = novos + renovados]
    K --> M[Total Empresariais = novos + renovados]

    L --> N[Valor Pessoais = Total × R$ 100]
    M --> O[Valor Empresariais = Total × R$ 90]

    N --> P[Soma valores]
    O --> P
    P --> Q[Valor Total de Vendas]

    Q --> R[Busca percentual do vendedor]
    R --> S[Comissão = Valor Total × percentage / 100]

    S --> T[Exibe no relatório]
    T --> U[Mostra dados de PIX para pagamento]

    U --> V[Admin/Gestor pode exportar]
    V --> W[Processa pagamentos]

    style A fill:#e1f5ff
    style W fill:#d4edda
```

---

## 14. Fluxo de Link Personalizado

### Diagrama: Geração e Uso do Link

```mermaid
flowchart TD
    A[Admin/Gestor acessa card do vendedor] --> B[Clica em Gerar Link]
    B --> C[Sistema captura ID do vendedor]
    C --> D[Gera URL: /convenio/vendedor-id]
    D --> E[Exibe modal com link]
    E --> F[Botão para copiar link]

    F --> G[Vendedor recebe o link]
    G --> H[Compartilha com clientes]
    H --> I[Cliente clica no link]

    I --> J[Abre página /convenio/vendedor-id]
    J --> K[Sistema detecta ID na URL]
    K --> L[Busca dados do vendedor]
    L --> M[Busca unidade do vendedor]

    M --> N[Pré-preenche formulário]
    N --> O[Vendedor: selecionado e bloqueado]
    N --> P[Unidade: selecionada mas editável]

    O --> Q[Cliente preenche resto do formulário]
    P --> Q
    Q --> R[Envia cadastro]
    R --> S[Convênio criado vinculado ao vendedor]

    S --> T[Vendedor vê novo convênio no dashboard]
    T --> U[Comissão é calculada automaticamente]

    style A fill:#e1f5ff
    style U fill:#d4edda
```

---

## 15. Mapa de Navegação do Sistema

### Diagrama: Estrutura de Páginas

```
Sistema Mais Saúde LASAC
│
├── 🔓 Público (Não autenticado)
│   ├── /authentication (Login/Cadastro)
│   ├── /convenio (Cadastro público)
│   └── /convenio/[vendedorId] (Cadastro com vendedor)
│
└── 🔐 Protegido (Autenticado)
    │
    ├── 👑 ADMIN
    │   ├── /dashboard
    │   ├── /patients (Convênios)
    │   ├── /sellers (Vendedores)
    │   ├── /clinics (Unidades)
    │   ├── /management (Relatórios)
    │   └── /admin (Gerenciar Usuários)
    │
    ├── 📋 GESTOR
    │   ├── /gerente/dashboard-gestor
    │   ├── /gerente/patients-gestor
    │   └── /gerente/sellers-gestor
    │
    └── 💼 VENDEDOR
        ├── /vendedor/dashboard-seller
        └── /vendedor/patients-seller
```

---

## 16. Timeline de um Dia Típico

### Para Administrador

```
08:00 ━━ Login no sistema
08:05 ━━ Verificar dashboard geral
08:15 ━━ Revisar novos cadastros pendentes
08:30 ━━ Aprovar/Ativar convênios
09:00 ━━ Verificar convênios a vencer (próximos 30 dias)
09:30 ━━ Contatar vendedores sobre renovações
10:00 ━━ Analisar relatórios do mês
11:00 ━━ Reunião com gestores
14:00 ━━ Cadastrar novos vendedores
15:00 ━━ Atualizar informações de pagamento
16:00 ━━ Exportar relatórios para contabilidade
17:00 ━━ Gerenciar usuários e permissões
18:00 ━━ Revisar métricas do dia e logout
```

### Para Gestor

```
08:00 ━━ Login no sistema
08:05 ━━ Verificar dashboard da unidade
08:15 ━━ Revisar convênios da unidade
08:30 ━━ Processar renovações pendentes
09:00 ━━ Contato com vendedores da equipe
10:00 ━━ Cadastrar novos convênios
11:00 ━━ Analisar performance dos vendedores
14:00 ━━ Atualizar dados de vendedores
15:00 ━━ Gerar relatório da unidade
16:00 ━━ Planejar ações para próxima semana
17:00 ━━ Revisar metas e logout
```

### Para Vendedor

```
08:00 ━━ Login no sistema
08:05 ━━ Verificar dashboard pessoal
08:15 ━━ Revisar comissões do mês
08:30 ━━ Verificar status dos convênios
09:00 ━━ Compartilhar link de cadastro
10:00 ━━ Acompanhar novos cadastros
11:00 ━━ Atualizar informações de contato
14:00 ━━ Prospectar novos clientes
16:00 ━━ Revisar métricas pessoais
17:00 ━━ Planejar metas e logout
```

---

## 📝 Como Usar Estes Diagramas

### Visualização

**Diagramas Mermaid:**

- Podem ser renderizados em GitHub, GitLab, VS Code (com extensão)
- Use visualizadores online como [Mermaid Live Editor](https://mermaid.live/)

**Diagramas ASCII:**

- Visualize diretamente em qualquer editor de texto
- Úteis para documentação rápida

### Integração no Manual

Adicione ao manual principal nas seções correspondentes:

```markdown
## Processo de Cadastro

Veja o fluxo completo no diagrama abaixo:

[Inserir diagrama aqui]

O processo segue os seguintes passos...
```

---

## 🎨 Legenda de Cores

```mermaid
flowchart LR
    A[Início do Processo]
    B[Ação do Usuário]
    C[Decisão/Validação]
    D[Processo do Sistema]
    E[Sucesso/Conclusão]
    F[Erro/Problema]
    G[Informação/Aviso]

    style A fill:#e1f5ff
    style B fill:#fff
    style C fill:#ffe6a7
    style D fill:#e3f2fd
    style E fill:#d4edda
    style F fill:#f8d7da
    style G fill:#fff3cd
```

---

## 💡 Dicas para Leitura dos Diagramas

1. **Siga as setas** - Indicam o fluxo lógico
2. **Losangos** - Representam decisões/condições
3. **Retângulos** - Representam ações/processos
4. **Cores** - Indicam tipo de elemento (ver legenda)
5. **Linhas tracejadas** - Fluxos alternativos ou opcionais

---

**Versão:** 1.0  
**Data:** Novembro 2024  
**Sistema Mais Saúde LASAC**


