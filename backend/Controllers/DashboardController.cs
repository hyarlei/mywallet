using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.DTOs;
using MyWallet.API.Domain.Entities; // Ajuste namespaces se precisar

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardResponseDto>> GetDashboard()
        {
            // O ID do usuário "fixo" por enquanto (depois pegaremos do Login)
            var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            // 1. Busca todas as transações desse usuário
            var transactions = await _context.Transactions
                .Where(t => t.UserId == userId)
                .ToListAsync();

            // 2. Calcula Entradas (Income = 1)
            var income = transactions
                .Where(t => t.Type == TransactionType.Income)
                .Sum(t => t.Amount);

            // 3. Calcula Saídas (Expense = 2)
            var expense = transactions
                .Where(t => t.Type == TransactionType.Expense)
                .Sum(t => t.Amount);

            // 4. Calcula Saldo
            var balance = income - expense;

            // 5. Retorna o objeto pronto pro Front
            return Ok(new DashboardResponseDto(income, expense, balance));
        }
    }
}