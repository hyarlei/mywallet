using Microsoft.AspNetCore.Mvc;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeedController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Popula o banco de dados com dados de teste
        /// Acesse: GET /api/seed
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> SeedDatabase()
        {
            try
            {
                // Verifica se já existe dados
                if (_context.Users.Any())
                {
                    return Ok(new { message = "Banco já populado. Use DELETE /api/seed para limpar primeiro." });
                }

                // 1. Criar usuário de teste
                var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");
                var user = new User
                {
                    Id = userId,
                    Name = "Hyarlei Dev",
                    Email = "hyarlei@test.com",
                    GoogleId = "google123",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(user);

                // 2. Criar categorias
                var categories = new[]
                {
                    new Category { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Freelas", Type = TransactionType.Income, Color = "#10b981", Icon = "laptop", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "Salário", Type = TransactionType.Income, Color = "#22c55e", Icon = "banknote", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "Alimentação", Type = TransactionType.Expense, Color = "#f97316", Icon = "utensils", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "Transporte", Type = TransactionType.Expense, Color = "#3b82f6", Icon = "car", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Name = "Casa", Type = TransactionType.Expense, Color = "#6366f1", Icon = "home", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), Name = "Lazer", Type = TransactionType.Expense, Color = "#a855f7", Icon = "gamepad-2", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), Name = "Outros", Type = TransactionType.Expense, Color = "#6b7280", Icon = "package", UserId = userId, CreatedAt = DateTime.UtcNow }
                };
                _context.Categories.AddRange(categories);

                // 3. Criar transações de exemplo
                var transactions = new[]
                {
                    new Transaction { Description = "Freela BarberFlow", Amount = 2500.00m, Date = DateTime.Parse("2026-01-15"), Type = TransactionType.Income, IsPaid = true, CategoryId = Guid.Parse("22222222-2222-2222-2222-222222222222"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Salário Janeiro", Amount = 5000.00m, Date = DateTime.Parse("2026-01-05"), Type = TransactionType.Income, IsPaid = true, CategoryId = Guid.Parse("33333333-3333-3333-3333-333333333333"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Almoço Restaurante", Amount = 45.90m, Date = DateTime.Parse("2026-01-16"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("44444444-4444-4444-4444-444444444444"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Uber para o trabalho", Amount = 25.00m, Date = DateTime.Parse("2026-01-16"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("55555555-5555-5555-5555-555555555555"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Mercado", Amount = 320.50m, Date = DateTime.Parse("2026-01-14"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("44444444-4444-4444-4444-444444444444"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Gasolina", Amount = 250.00m, Date = DateTime.Parse("2026-01-12"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("55555555-5555-5555-5555-555555555555"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Netflix", Amount = 55.90m, Date = DateTime.Parse("2026-01-10"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("77777777-7777-7777-7777-777777777777"), UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Transaction { Description = "Conta de Luz", Amount = 180.00m, Date = DateTime.Parse("2026-01-08"), Type = TransactionType.Expense, IsPaid = true, CategoryId = Guid.Parse("66666666-6666-6666-6666-666666666666"), UserId = userId, CreatedAt = DateTime.UtcNow }
                };
                _context.Transactions.AddRange(transactions);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "✅ Banco populado com sucesso!",
                    data = new
                    {
                        users = 1,
                        categories = categories.Length,
                        transactions = transactions.Length
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// Limpa todos os dados do banco
        /// Acesse: DELETE /api/seed
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> ClearDatabase()
        {
            try
            {
                _context.Transactions.RemoveRange(_context.Transactions);
                _context.Categories.RemoveRange(_context.Categories);
                _context.Goals.RemoveRange(_context.Goals);
                _context.Users.RemoveRange(_context.Users);

                await _context.SaveChangesAsync();

                return Ok(new { message = "🗑️ Banco limpo com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}
