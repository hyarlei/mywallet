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
```

Acesse: `http://localhost:8000`

### 3. Popule o Banco de Dados

Após fazer seu Login crie as Categorias.

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

Certifique-se de que o backend está rodando nesta porta!
