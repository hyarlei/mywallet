# 🔒 GUIA DE SEGURANÇA - MyWallet API

## ⚠️ AÇÕES CRÍTICAS IMPLEMENTADAS

### ✅ Correções Aplicadas (26 de Janeiro de 2026)

#### 1. Proteção de Credenciais

- ✅ Criado arquivo `.env` para variáveis sensíveis
- ✅ Criado `.env.example` como template
- ✅ Adicionado `.gitignore` para proteger `.env`
- ✅ Reduzido tempo de expiração JWT de 24h para 1h

#### 2. Autorização e Validação de Ownership

- ✅ Adicionado `[Authorize]` no `UsersController`
- ✅ Removidos endpoints perigosos que listavam todos os usuários
- ✅ Adicionada validação de ownership em:
  - `CreditCardsController` (Update, Delete)
  - `GoalsController` (Update, Delete, AddAmount)
- ✅ Apenas o proprietário pode acessar/modificar seus recursos

#### 3. Middleware de Tratamento de Erros

- ✅ Criado `ErrorHandlingMiddleware` para capturar exceções globalmente
- ✅ Evita vazamento de informações sensíveis em erros
- ✅ Logs estruturados de erros

#### 4. Validações de Negócio

- ✅ Categoria deve ser do mesmo tipo da transação (receita/despesa)
- ✅ `Last4Digits` de cartão deve ter exatamente 4 dígitos numéricos
- ✅ `DueDay` deve estar entre 1-31
- ✅ Valores não podem ser negativos (fatura, limite, currentAmount)

#### 5. Rate Limiting

- ✅ Implementado com `AspNetCoreRateLimit`
- ✅ Limite geral: 100 requisições/minuto
- ✅ Endpoints de autenticação: 10 requisições/minuto
- ✅ Proteção contra ataques de força bruta

---

## 🚨 AÇÕES URGENTES NECESSÁRIAS

### ANTES DE FAZER COMMIT

**⚠️ IMPORTANTE: NÃO COMMITE O ARQUIVO .env!**

1. **Verifique o .gitignore:**

   ```bash
   cat .gitignore | grep .env
   ```

   Deve aparecer `.env` na lista.

2. **Remova credenciais já commitadas:**

   ```bash
   git rm --cached backend/appsettings.json
   git add backend/appsettings.json
   git commit -m "chore: remove sensitive data from appsettings.json"
   ```

3. **Invalide as credenciais expostas:**
   - ❌ Regenerar Google OAuth credentials no [Google Cloud Console](https://console.cloud.google.com)
   - ❌ Alterar senha do PostgreSQL
   - ❌ Gerar novo JWT Secret (mínimo 32 caracteres)

### ANTES DE DEPLOY EM PRODUÇÃO

#### 1. Configure Variáveis de Ambiente no Servidor

**Azure App Service:**

```bash
az webapp config appsettings set --name mywalletapi \
  --resource-group myresourcegroup \
  --settings \
    JWT_SECRET="seu-novo-secret-aqui" \
    GOOGLE_CLIENT_ID="seu-client-id" \
    GOOGLE_CLIENT_SECRET="seu-client-secret"
```

**AWS / Heroku / Docker:**

```bash
export JWT_SECRET="seu-novo-secret-aqui"
export GOOGLE_CLIENT_ID="seu-client-id"
export GOOGLE_CLIENT_SECRET="seu-client-secret"
export DB_PASSWORD="senha-forte-aqui"
```

#### 2. Use Secrets Manager (Recomendado)

- Azure Key Vault
- AWS Secrets Manager
- HashiCorp Vault

#### 3. Configurações Adicionais de Segurança

**HTTPS Obrigatório:**

```csharp
// Program.cs - já está configurado, mas garanta em produção
app.UseHttpsRedirection();
```

**CORS Restritivo:**

```csharp
// Substitua "AllowAll" por lista específica de origens
builder.Services.AddCors(options =>
{
    options.AddPolicy("Production", builder =>
    {
        builder.WithOrigins("https://mywallet.com", "https://app.mywallet.com")
               .AllowAnyMethod()
               .AllowAnyHeader()
               .AllowCredentials();
    });
});
```

---

## 🛡️ MELHORIAS RECOMENDADAS (Próximas)

### Segurança Avançada

- [ ] Implementar refresh tokens (JWT de curta duração)
- [ ] Adicionar 2FA (autenticação de dois fatores)
- [ ] Implementar CSRF tokens
- [ ] Adicionar Content Security Policy (CSP)
- [ ] Implementar helmet/security headers
- [ ] Audit logging de ações sensíveis

### Infraestrutura

- [ ] Configurar HTTPS com Let's Encrypt
- [ ] Implementar backups automáticos do banco
- [ ] Configurar alertas de segurança
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Scan de vulnerabilidades automatizado

### Monitoramento

- [ ] Implementar Application Insights / Sentry
- [ ] Monitorar tentativas de login falhadas
- [ ] Alertas de rate limiting atingido
- [ ] Dashboard de segurança

---

## 📋 CHECKLIST PRÉ-DEPLOY

- [ ] Todas as credenciais estão em variáveis de ambiente
- [ ] `.env` está no `.gitignore`
- [ ] Nenhuma senha está no código-fonte
- [ ] JWT Secret tem mínimo 32 caracteres
- [ ] HTTPS está configurado
- [ ] CORS está restritivo para produção
- [ ] Rate limiting está ativo
- [ ] Logs de erro estão funcionando
- [ ] Backups do banco estão configurados
- [ ] Credenciais antigas foram invalidadas

---

## 🔐 GERAÇÃO DE SECRETS SEGUROS

**JWT Secret (PowerShell):**

```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**JWT Secret (Bash):**

```bash
openssl rand -base64 64
```

**JWT Secret (Node.js):**

```javascript
require('crypto').randomBytes(64).toString('base64')
```

---

## 📞 SUPORTE

Em caso de incidente de segurança:

1. Revogue imediatamente as credenciais comprometidas
2. Force logout de todos os usuários
3. Analise logs para identificar acessos não autorizados
4. Notifique usuários afetados
5. Implemente correções

---

**Última atualização:** 26 de Janeiro de 2026
**Status:** ✅ Correções críticas aplicadas | ⚠️ Ações manuais pendentes
