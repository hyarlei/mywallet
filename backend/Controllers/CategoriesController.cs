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
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CategoriesController(AppDbContext context) => _context = context;

        // GET: api/categories
        [HttpGet]
        public async Task<ActionResult<List<CategoryDto>>> GetAll()
        {
            // Pegar userId do token JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Token inválido.");

            var categories = await _context.Categories
                .Where(c => c.UserId == userId)
                .ToListAsync();
            
            // Se não tem categorias, cria as padrão
            if (!categories.Any())
            {
                var defaultCategories = new[]
                {
                    new Category { Name = "Freelas", Type = TransactionType.Income, Color = "#10b981", Icon = "laptop", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Salário", Type = TransactionType.Income, Color = "#22c55e", Icon = "banknote", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Alimentação", Type = TransactionType.Expense, Color = "#f97316", Icon = "utensils", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Transporte", Type = TransactionType.Expense, Color = "#3b82f6", Icon = "car", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Casa", Type = TransactionType.Expense, Color = "#6366f1", Icon = "home", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Lazer", Type = TransactionType.Expense, Color = "#a855f7", Icon = "gamepad-2", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Saúde", Type = TransactionType.Expense, Color = "#ef4444", Icon = "heart", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Educação", Type = TransactionType.Expense, Color = "#3b82f6", Icon = "book", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Investimentos", Type = TransactionType.Expense, Color = "#22c55e", Icon = "trending-up", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Compras", Type = TransactionType.Expense, Color = "#ec4899", Icon = "shopping-bag", UserId = userId, CreatedAt = DateTime.UtcNow },
                    new Category { Name = "Outros", Type = TransactionType.Expense, Color = "#6b7280", Icon = "package", UserId = userId, CreatedAt = DateTime.UtcNow }
                };
                
                _context.Categories.AddRange(defaultCategories);
                await _context.SaveChangesAsync();
                
                categories = defaultCategories.ToList();
            }
            
            var dtos = categories.Select(c => new CategoryDto(
                c.Id,
                c.Name,
                c.Type,
                c.Color,
                c.Icon,
                c.UserId,
                c.CreatedAt
            ));

            return Ok(dtos);
        }

        // GET: api/categories/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> GetById(Guid id)
        {
            var category = await _context.Categories.FindAsync(id);
            
            if (category == null)
                return NotFound("Categoria não encontrada.");

            var dto = new CategoryDto(
                category.Id,
                category.Name,
                category.Type,
                category.Color,
                category.Icon,
                category.UserId,
                category.CreatedAt
            );

            return Ok(dto);
        }

        // POST: api/categories
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
        {
            // Verifica se já existe categoria com mesmo nome para o usuário
            var exists = await _context.Categories
                .AnyAsync(c => c.UserId == dto.UserId && c.Name == dto.Name);

            if (exists)
                return BadRequest("Já existe uma categoria com este nome.");

            var category = new Category
            {
                Name = dto.Name,
                Type = dto.Type,
                Color = dto.Color,
                Icon = dto.Icon ?? string.Empty,
                UserId = dto.UserId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            var responseDto = new CategoryDto(
                category.Id,
                category.Name,
                category.Type,
                category.Color,
                category.Icon,
                category.UserId,
                category.CreatedAt
            );

            return CreatedAtAction(nameof(GetById), new { id = category.Id }, responseDto);
        }

        // PUT: api/categories/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] CreateCategoryDto dto)
        {
            var category = await _context.Categories.FindAsync(id);
            
            if (category == null)
                return NotFound("Categoria não encontrada.");

            // Verifica se o usuário é o dono da categoria
            if (category.UserId != dto.UserId)
                return Forbid();

            // Verifica se já existe outra categoria com mesmo nome
            var exists = await _context.Categories
                .AnyAsync(c => c.UserId == dto.UserId && c.Name == dto.Name && c.Id != id);

            if (exists)
                return BadRequest("Já existe uma categoria com este nome.");

            category.Name = dto.Name;
            category.Type = dto.Type;
            category.Color = dto.Color;
            category.Icon = dto.Icon ?? string.Empty;
            category.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var responseDto = new CategoryDto(
                category.Id,
                category.Name,
                category.Type,
                category.Color,
                category.Icon,
                category.UserId,
                category.CreatedAt
            );

            return Ok(responseDto);
        }

        // DELETE: api/categories/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var category = await _context.Categories
                .Include(c => c.Transactions)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
                return NotFound("Categoria não encontrada.");

            // Verifica se há transações usando esta categoria
            if (category.Transactions.Any())
                return BadRequest("Não é possível deletar uma categoria que possui transações associadas.");

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Categoria deletada com sucesso." });
        }
    }
}