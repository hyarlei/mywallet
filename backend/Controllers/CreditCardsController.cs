using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CreditCardsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CreditCardsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/creditcards
        [HttpGet]
        public async Task<ActionResult<List<CreditCardDto>>> GetAll([FromQuery] Guid? userId)
        {
            var query = _context.CreditCards.AsQueryable();

            // Filtra por usuário se fornecido
            if (userId.HasValue)
                query = query.Where(c => c.UserId == userId.Value);

            var cards = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

            var dtos = cards.Select(c => new CreditCardDto(
                c.Id,
                c.Name,
                c.Bank,
                c.Flag,
                c.Last4Digits,
                c.CurrentBill,
                c.CreditLimit,
                c.DueDay,
                c.UserId,
                c.CreatedAt
            ));

            return Ok(dtos);
        }

        // GET: api/creditcards/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CreditCardDto>> GetById(Guid id)
        {
            var card = await _context.CreditCards.FindAsync(id);

            if (card == null)
                return NotFound(new { message = "Cartão não encontrado" });

            var dto = new CreditCardDto(
                card.Id,
                card.Name,
                card.Bank,
                card.Flag,
                card.Last4Digits,
                card.CurrentBill,
                card.CreditLimit,
                card.DueDay,
                card.UserId,
                card.CreatedAt
            );

            return Ok(dto);
        }

        // POST: api/creditcards
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCreditCardDto dto)
        {
            // Validar que os últimos 4 dígitos são únicos para o usuário
            var existingCard = await _context.CreditCards
                .FirstOrDefaultAsync(c => c.UserId == dto.UserId && c.Last4Digits == dto.Last4Digits);

            if (existingCard != null)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Já existe um cartão com esses últimos 4 dígitos" } });

            var card = new CreditCard
            {
                Name = dto.Name.Trim(),
                Bank = dto.Bank.Trim(),
                Flag = dto.Flag.Trim(),
                Last4Digits = dto.Last4Digits,
                CurrentBill = dto.CurrentBill,
                CreditLimit = dto.CreditLimit,
                DueDay = dto.DueDay,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CreditCards.Add(card);
            await _context.SaveChangesAsync();

            var responseDto = new CreditCardDto(
                card.Id,
                card.Name,
                card.Bank,
                card.Flag,
                card.Last4Digits,
                card.CurrentBill,
                card.CreditLimit,
                card.DueDay,
                card.UserId,
                card.CreatedAt
            );

            return CreatedAtAction(nameof(GetById), new { id = card.Id }, responseDto);
        }

        // PUT: api/creditcards/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateCreditCardDto dto)
        {
            var card = await _context.CreditCards.FindAsync(id);

            if (card == null)
                return NotFound(new { message = "Cartão não encontrado" });

            // Verifica se o usuário é o dono do cartão
            if (card.UserId != dto.UserId)
                return Forbid();

            // Validar que os últimos 4 dígitos são únicos para o usuário (exceto o próprio cartão)
            var existingCard = await _context.CreditCards
                .FirstOrDefaultAsync(c => c.UserId == dto.UserId && c.Last4Digits == dto.Last4Digits && c.Id != id);

            if (existingCard != null)
                return BadRequest(new { message = "Validação falhou", errors = new[] { "Já existe outro cartão com esses últimos 4 dígitos" } });

            card.Name = dto.Name.Trim();
            card.Bank = dto.Bank.Trim();
            card.Flag = dto.Flag.Trim();
            card.Last4Digits = dto.Last4Digits;
            card.CurrentBill = dto.CurrentBill;
            card.CreditLimit = dto.CreditLimit;
            card.DueDay = dto.DueDay;
            card.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new CreditCardDto(
                card.Id,
                card.Name,
                card.Bank,
                card.Flag,
                card.Last4Digits,
                card.CurrentBill,
                card.CreditLimit,
                card.DueDay,
                card.UserId,
                card.CreatedAt
            );

            return Ok(responseDto);
        }

        // PATCH: api/creditcards/{id}/bill - Atualizar apenas o valor da fatura
        [HttpPatch("{id}/bill")]
        public async Task<IActionResult> UpdateBill(Guid id, [FromBody] UpdateBillDto dto)
        {
            var card = await _context.CreditCards.FindAsync(id);

            if (card == null)
                return NotFound(new { message = "Cartão não encontrado" });

            card.CurrentBill = dto.CurrentBill;
            card.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var responseDto = new CreditCardDto(
                card.Id,
                card.Name,
                card.Bank,
                card.Flag,
                card.Last4Digits,
                card.CurrentBill,
                card.CreditLimit,
                card.DueDay,
                card.UserId,
                card.CreatedAt
            );

            return Ok(responseDto);
        }

        // DELETE: api/creditcards/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var card = await _context.CreditCards.FindAsync(id);

            if (card == null)
                return NotFound(new { message = "Cartão não encontrado" });

            _context.CreditCards.Remove(card);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cartão deletado com sucesso" });
        }
    }
}
