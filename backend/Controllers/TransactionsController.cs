using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        // Injeção de Dependência do Banco
        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/transactions
        [HttpGet]
        public async Task<ActionResult<List<TransactionDto>>> GetAll()
        {
            // Busca no banco incluindo a Categoria (Join)
            var transactions = await _context.Transactions
                .Include(t => t.Category) 
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            // Transforma (Map) de Entidade para DTO
            var dtos = transactions.Select(t => new TransactionDto(
                t.Id,
                t.Description,
                t.Amount,
                t.Type.ToString(),
                t.Date,
                t.Category?.Name ?? "Sem Categoria",
                t.IsPaid
            ));

            return Ok(dtos);
        }

        // POST: api/transactions
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto)
        {
            // Valida se a categoria existe
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null) return BadRequest("Categoria não encontrada.");

            // Cria a Entidade
            var transaction = new Transaction
            {
                Description = dto.Description,
                Amount = dto.Amount,
                Date = dto.Date,
                Type = dto.Type,
                CategoryId = dto.CategoryId,
                UserId = dto.UserId,
                IsPaid = false, // Padrão
                CreatedAt = DateTime.UtcNow
            };

            _context.Transactions.Add(transaction);
            await _context.SaveChangesAsync();

            // Retorna um DTO simples ao invés da entidade completa
            var responseDto = new TransactionDto(
                transaction.Id,
                transaction.Description,
                transaction.Amount,
                transaction.Type.ToString(),
                transaction.Date,
                category.Name,
                transaction.IsPaid
            );

            return CreatedAtAction(nameof(GetAll), new { id = transaction.Id }, responseDto);
        }
    }
}