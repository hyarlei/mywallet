using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using System.Security.Claims;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            // Pegar userId do token JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Token inválido.");

            // Busca no banco apenas transações do usuário autenticado
            var transactions = await _context.Transactions
                .Include(t => t.Category)
                .Where(t => t.UserId == userId)
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
                t.CategoryId,
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
                transaction.CategoryId,
                transaction.IsPaid
            );

            return CreatedAtAction(nameof(GetAll), new { id = transaction.Id }, responseDto);
        }

        // PUT: api/transactions/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateTransactionDto dto)
        {
            // Busca a transação existente
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null) return NotFound("Transação não encontrada.");

            // Valida se a categoria existe
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null) return BadRequest("Categoria não encontrada.");

            // Atualiza os dados
            transaction.Description = dto.Description;
            transaction.Amount = dto.Amount;
            transaction.Date = dto.Date;
            transaction.Type = dto.Type;
            transaction.CategoryId = dto.CategoryId;
            transaction.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Retorna o DTO atualizado
            var responseDto = new TransactionDto(
                transaction.Id,
                transaction.Description,
                transaction.Amount,
                transaction.Type.ToString(),
                transaction.Date,
                category.Name,
                transaction.CategoryId,
                transaction.IsPaid
            );

            return Ok(responseDto);
        }

        // DELETE: api/transactions/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null) return NotFound("Transação não encontrada.");

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Transação deletada com sucesso." });
        }
    }
}