using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;
using System.Security.Claims;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/users/me - Retorna apenas o usuário autenticado
        [HttpGet("me")]
        public async Task<ActionResult<User>> GetCurrentUser()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Token inválido.");

            var user = await _context.Users.FindAsync(userId);
            
            if (user == null)
                return NotFound("Usuário não encontrado.");
            
            return Ok(user);
        }

        // GET: api/users/{id} - Apenas o próprio usuário pode acessar
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetById(Guid id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Token inválido.");

            // Só pode acessar seus próprios dados
            if (userId != id)
                return Forbid();

            var user = await _context.Users.FindAsync(id);
            
            if (user == null)
                return NotFound("Usuário não encontrado.");
            
            return Ok(user);
        }
    }
}
