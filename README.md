# 💰 MyWallet - Gerenciador de Finanças Pessoais

Um sistema completo de gestão financeira pessoal desenvolvido com **.NET 8** e **PostgreSQL** no backend, e **HTML/JavaScript/TailwindCSS** no frontend.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![.NET](https://img.shields.io/badge/.NET-8.0-purple.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)

## 📋 Sobre o Projeto

MyWallet é uma aplicação web para controle de finanças pessoais que permite:

- 💸 Gerenciar receitas e despesas
- 📊 Visualizar dashboard com resumos financeiros
- 📈 Acompanhar gastos através de gráficos interativos
- 🎯 Definir e acompanhar metas financeiras
- 🏷️ Categorizar transações
- 🌙 Dark mode para melhor experiência visual

## 🚀 Tecnologias

### Backend

- **.NET 8** - Framework principal
- **Entity Framework Core** - ORM
- **PostgreSQL** - Banco de dados
- **Npgsql** - Provider para PostgreSQL
- **Swagger/OpenAPI** - Documentação da API

### Frontend

- **HTML5 + CSS3**
- **JavaScript (Vanilla)**
- **TailwindCSS** - Framework CSS
- **Chart.js** - Gráficos interativos
- **Lucide Icons** - Ícones

## 📁 Estrutura do Projeto

```MyWallet.API/
├── backend/
│   ├── Controllers/          # API Controllers
│   ├── Domain/
│   │   └── Entities/        # Entidades do domínio
│   ├── Data/                # Contexto do banco
│   ├── DTOs/                # Data Transfer Objects
│   ├── Migrations/          # Migrations do EF Core
│   ├── Program.cs           # Configuração da aplicação
│   └── appsettings.json     # Configurações
├── frontend/
│   ├── index.html           # Interface principal
│   ├── app.js               # Lógica do frontend
│   ├── test.html            # Página de testes
│   └── package.json         # Scripts do frontend
└── README.md                # Este arquivo
```

## 🛠️ Configuração e Instalação

### Pré-requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [PostgreSQL 12+](https://www.postgresql.org/download/)
- Node.js (opcional, para servidor HTTP do frontend)

### 1️⃣ Configurar o Banco de Dados

1. Instale e inicie o PostgreSQL
2. Crie o banco de dados:

```sql
CREATE DATABASE mywallet_db;
```

1. Configure a string de conexão em `backend/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=mywallet_db;Username=postgres;Password=sua_senha"
  }
}
```

### 2️⃣ Configurar o Backend

```bash
# Navegue até a pasta do backend
cd backend

# Restaure as dependências
dotnet restore

# Execute as migrations
dotnet ef database update

# Inicie o servidor
dotnet watch run
```

O backend estará disponível em: **<http://localhost:5296>**

Swagger UI: **<http://localhost:5296/swagger>**

### 3️⃣ Popular o Banco (Opcional)

Para popular com dados de teste:

**Opção 1 - Via API:**

```bash
curl http://localhost:5296/api/Seed
```

**Opção 2 - Via Swagger:**

- Acesse <http://localhost:5296/swagger>
- Execute `GET /api/Seed`

**Opção 3 - Via SQL:**

```bash
psql -U postgres -d mywallet_db -f backend/seed.sql
```

### 4️⃣ Iniciar o Frontend

**Opção 1 - Abrir diretamente no navegador:**

```bash
# Abra o arquivo no navegador
open frontend/index.html
```

**Opção 2 - Usar servidor HTTP (recomendado):**

```bash
cd frontend

# Com npm
npm run dev

# Ou com Python
python3 -m http.server 8000
```

Acesse: **<http://localhost:8000>**

## 📖 Como Usar

1. **Login**: Clique em "Entrar com Google" (simulado por enquanto)
2. **Dashboard**: Visualize o resumo das suas finanças
3. **Adicionar Transação**: Preencha o formulário lateral
4. **Visualizar Histórico**: Veja todas as transações com filtro por mês
5. **Gráficos**: Acompanhe seus gastos visualmente
6. **Dark Mode**: Clique no ícone da lua para alternar

## 🔌 API Endpoints

### Transações

- `GET /api/Transactions` - Lista todas as transações
- `POST /api/Transactions` - Cria uma nova transação

### Categorias

- `GET /api/Categories` - Lista todas as categorias

### Dashboard

- `GET /api/Dashboard` - Retorna resumo financeiro

### Usuários

- `GET /api/Users` - Lista todos os usuários
- `POST /api/Users` - Cria um novo usuário

### Seed

- `GET /api/Seed` - Popula o banco com dados de teste
- `DELETE /api/Seed` - Limpa todos os dados

## 🎨 Funcionalidades

### ✅ Implementado

- [x] CRUD de Transações (Create, Read)
- [x] Dashboard com resumos financeiros
- [x] Gráficos de pizza e linha
- [x] Filtro por mês
- [x] Dark mode
- [x] Design responsivo
- [x] Categorização de transações
- [x] API REST completa

### 🚧 Em Desenvolvimento

- [ ] Editar/Deletar transações
- [ ] Autenticação com Google OAuth
- [ ] Módulo de Metas Financeiras
- [ ] Gerenciamento de Cartões de Crédito
- [ ] Exportar relatórios (CSV/PDF)
- [ ] Notificações e alertas
- [ ] Paginação e busca avançada

## 🗃️ Entidades do Banco

### User

- Id, Name, Email, GoogleId, AvatarUrl
- Relacionamentos: Transactions, Categories, Goals

### Transaction

- Id, Description, Amount, Date, Type (Income/Expense)
- IsPaid, CategoryId, UserId

### Category

- Id, Name, Type, Color, Icon
- UserId

### Goal

- Id, Title, TargetAmount, CurrentAmount
- Deadline, UserId

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estes passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Documentação Adicional

- [Frontend README](frontend/README.md) - Detalhes do frontend
- [Guia de Testes](TESTE.md) - Como testar a aplicação
- [Início Rápido](START.md) - Guia de início rápido

## 🐛 Problemas Conhecidos

### DateTime com PostgreSQL

Se encontrar erro de timezone, a configuração já está aplicada em `Program.cs`:

```csharp
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
```

### Ciclo de Referência JSON

Já configurado com `ReferenceHandler.IgnoreCycles` no `Program.cs`

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

***Hyarlei Silva***

- GitHub: [@hyarlei](https://github.com/hyarlei)

## 🙏 Agradecimentos

- Comunidade .NET
- TailwindCSS
- Chart.js
- Lucide Icons

---

⭐ Se este projeto te ajudou, considere dar uma estrela!

***Desenvolvido com ❤️ e .NET***
