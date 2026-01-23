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
            // Validação adicional de negócio
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "O valor deve ser maior que zero" } });

            if (dto.Date > DateTime.UtcNow.AddYears(5))
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Data não pode ser superior a 5 anos no futuro" } });

            if (dto.Date < DateTime.UtcNow.AddYears(-10))
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Data não pode ser anterior a 10 anos atrás" } });

            // Valida se a categoria existe
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Categoria não encontrada" } });

            // Valida se a categoria pertence ao usuário
            if (category.UserId != dto.UserId)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Categoria não pertence ao usuário" } });

            // Cria a Entidade
            var transaction = new Transaction
            {
                Description = dto.Description.Trim(),
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
            if (transaction == null)
                return NotFound(new { message = "Transação não encontrada" });

            // Validação adicional de negócio
            if (dto.Amount <= 0)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "O valor deve ser maior que zero" } });

            if (dto.Date > DateTime.UtcNow.AddYears(5))
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Data não pode ser superior a 5 anos no futuro" } });

            if (dto.Date < DateTime.UtcNow.AddYears(-10))
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Data não pode ser anterior a 10 anos atrás" } });

            // Valida se a categoria existe
            var category = await _context.Categories.FindAsync(dto.CategoryId);
            if (category == null)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Categoria não encontrada" } });

            // Valida se a categoria pertence ao usuário
            if (category.UserId != dto.UserId)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Categoria não pertence ao usuário" } });

            // Valida se a transação pertence ao usuário
            if (transaction.UserId != dto.UserId)
                return Forbid();

            // Atualiza os dados
            transaction.Description = dto.Description.Trim();
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