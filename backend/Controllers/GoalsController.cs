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
    public class GoalsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GoalsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/goals
        [HttpGet]
        public async Task<ActionResult<List<GoalDto>>> GetAll([FromQuery] Guid? userId)
        {
            var query = _context.Goals.AsQueryable();

            // Filtra por usuário se fornecido
            if (userId.HasValue)
                query = query.Where(g => g.UserId == userId.Value);

            var goals = await query.OrderByDescending(g => g.CreatedAt).ToListAsync();

            var dtos = goals.Select(g => new GoalDto(
                g.Id,
                g.Title,
                g.TargetAmount,
                g.CurrentAmount,
                CalculateProgress(g.CurrentAmount, g.TargetAmount),
                g.Deadline,
                g.UserId,
                g.CreatedAt
            ));

            return Ok(dtos);
        }

        // GET: api/goals/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GoalDto>> GetById(Guid id)
        {
            var goal = await _context.Goals.FindAsync(id);

            if (goal == null)
                return NotFound("Meta não encontrada.");

            var dto = new GoalDto(
                goal.Id,
                goal.Title,
                goal.TargetAmount,
                goal.CurrentAmount,
                CalculateProgress(goal.CurrentAmount, goal.TargetAmount),
                goal.Deadline,
                goal.UserId,
                goal.CreatedAt
            );

            return Ok(dto);
        }

        // POST: api/goals
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateGoalDto dto)
        {
            if (dto.TargetAmount <= 0)
                return BadRequest("O valor da meta deve ser maior que zero.");

            var goal = new Goal
            {
                Title = dto.Title,
                TargetAmount = dto.TargetAmount,
                CurrentAmount = dto.CurrentAmount >= 0 ? dto.CurrentAmount : 0,
                Deadline = dto.Deadline,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Goals.Add(goal);
            await _context.SaveChangesAsync();

            var responseDto = new GoalDto(
                goal.Id,
                goal.Title,
                goal.TargetAmount,
                goal.CurrentAmount,
                CalculateProgress(goal.CurrentAmount, goal.TargetAmount),
                goal.Deadline,
                goal.UserId,
                goal.CreatedAt
            );

            return CreatedAtAction(nameof(GetById), new { id = goal.Id }, responseDto);
        }

        // PUT: api/goals/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateGoalDto dto)
        {
            var goal = await _context.Goals.FindAsync(id);

            if (goal == null)
                return NotFound("Meta não encontrada.");

            // Verifica se o usuário é o dono da meta
            if (goal.UserId != dto.UserId)
                return Forbid();

            if (dto.TargetAmount <= 0)
                return BadRequest("O valor da meta deve ser maior que zero.");

            goal.Title = dto.Title;
            goal.TargetAmount = dto.TargetAmount;
            goal.CurrentAmount = dto.CurrentAmount >= 0 ? dto.CurrentAmount : 0;
            goal.Deadline = dto.Deadline;
            goal.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new GoalDto(
                goal.Id,
                goal.Title,
                goal.TargetAmount,
                goal.CurrentAmount,
                CalculateProgress(goal.CurrentAmount, goal.TargetAmount),
                goal.Deadline,
                goal.UserId,
                goal.CreatedAt
            );

            return Ok(responseDto);
        }

        // PATCH: api/goals/{id}/amount - Adicionar/Remover valor
        [HttpPatch("{id}/amount")]
        public async Task<IActionResult> UpdateAmount(Guid id, [FromBody] UpdateGoalAmountDto dto)
        {
            var goal = await _context.Goals.FindAsync(id);

            if (goal == null)
                return NotFound("Meta não encontrada.");

            if (dto.Amount <= 0)
                return BadRequest("O valor deve ser maior que zero.");

            if (dto.IsAddition)
            {
                goal.CurrentAmount += dto.Amount;
            }
            else
            {
                goal.CurrentAmount -= dto.Amount;
                if (goal.CurrentAmount < 0)
                    goal.CurrentAmount = 0;
            }

            goal.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var responseDto = new GoalDto(
                goal.Id,
                goal.Title,
                goal.TargetAmount,
                goal.CurrentAmount,
                CalculateProgress(goal.CurrentAmount, goal.TargetAmount),
                goal.Deadline,
                goal.UserId,
                goal.CreatedAt
            );

            return Ok(responseDto);
        }

        // DELETE: api/goals/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var goal = await _context.Goals.FindAsync(id);

            if (goal == null)
                return NotFound("Meta não encontrada.");

            _context.Goals.Remove(goal);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Meta deletada com sucesso." });
        }

        // Helper para calcular progresso
        private decimal CalculateProgress(decimal current, decimal target)
        {
            if (target <= 0) return 0;
            var progress = (current / target) * 100;
            return Math.Round(progress, 2);
        }
    }
}
