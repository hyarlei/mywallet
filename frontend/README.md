# MyWallet Frontend

## 🚀 Como Testar

### 1. Inicie o Backend (.NET)

```bash
cd backend
dotnet watch run
```

O servidor deve iniciar em `http://localhost:5296`

### 2. Abra o Frontend

Abra o arquivo `index.html` no navegador ou use um servidor HTTP local:

```bash
# Opção 1: Python
python3 -m http.server 8000

# Opção 2: Node.js (http-server)
npx http-server -p 8000

# Opção 3: VS Code Live Server
# Clique com botão direito em index.html > Open with Live Server
```

Acesse: `http://localhost:8000`

### 3. Popule o Banco de Dados

Execute os seguintes comandos no Swagger ou use o script SQL:

#### Criar um Usuário

```bash
POST /api/Users
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "Hyarlei Dev",
  "email": "hyarlei@test.com",
  "googleId": "google123"
}
```

#### Criar Categorias

```bash
POST /api/Categories
{
  "id": "22222222-2222-2222-2222-222222222222",
  "name": "Freelas",
  "type": 1,
  "color": "#10b981",
  "userId": "11111111-1111-1111-1111-111111111111"
}

POST /api/Categories
{
  "id": "33333333-3333-3333-3333-333333333333",
  "name": "Alimentação",
  "type": 2,
  "color": "#f97316",
  "userId": "11111111-1111-1111-1111-111111111111"
}

POST /api/Categories
{
  "id": "44444444-4444-4444-4444-444444444444",
  "name": "Transporte",
  "type": 2,
  "color": "#3b82f6",
  "userId": "11111111-1111-1111-1111-111111111111"
}
```

### 4. Teste Criando Transações

Use o formulário no frontend para adicionar transações!

## 📝 Funcionalidades Implementadas

✅ Dashboard com cards de resumo (Entradas, Saídas, Saldo)
✅ Adicionar transações
✅ Listar transações com filtro por mês
✅ Gráfico de pizza (Entradas vs Saídas)
✅ Gráfico de linha (Gastos diários)
✅ Dark mode
✅ Integração completa com API .NET

## 🔧 Configuração

O arquivo `app.js` está configurado para:

- **API URL**: `http://localhost:5296/api`
- **USER ID Fixo**: `11111111-1111-1111-1111-111111111111`

Certifique-se de que o backend está rodando nesta porta!
