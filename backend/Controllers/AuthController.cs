using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using MyWallet.API.Services;

namespace MyWallet.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly TokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;

        public AuthController(
            AppDbContext context, 
            TokenService tokenService, 
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _tokenService = tokenService;
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
        }

        // POST: api/auth/google
        [HttpPost("google")]
        public async Task<ActionResult<AuthResponse>> GoogleLogin([FromBody] GoogleAuthRequest request)
        {
            try
            {
                // Validar o token do Google
                var googleUser = await ValidateGoogleToken(request.IdToken);
                
                if (googleUser == null)
                    return Unauthorized("Token inválido do Google.");

                // Buscar ou criar usuário no banco
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == googleUser.Email);

                if (user == null)
                {
                    // Criar novo usuário
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = googleUser.Email,
                        Name = googleUser.Name,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Atualizar informações se mudaram
                    if (user.Name != googleUser.Name)
                    {
                        user.Name = googleUser.Name;
                        user.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }

                // Gerar JWT token
                var token = _tokenService.GenerateToken(user.Id, user.Email, user.Name);

                return Ok(new AuthResponse(token, user.Id, user.Email, user.Name));
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erro ao autenticar com Google.", error = ex.Message });
            }
        }

        private async Task<GoogleUserInfo?> ValidateGoogleToken(string idToken)
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");
                
                if (!response.IsSuccessStatusCode)
                    return null;

                var content = await response.Content.ReadAsStringAsync();
                var tokenInfo = JsonSerializer.Deserialize<GoogleTokenInfo>(content, new JsonSerializerOptions 
                { 
                    PropertyNameCaseInsensitive = true 
                });

                if (tokenInfo == null)
                    return null;

                // Validar o audience (ClientId)
                var expectedClientId = _configuration["Google:ClientId"];
                if (tokenInfo.Aud != expectedClientId)
                    return null;

                return new GoogleUserInfo
                {
                    Email = tokenInfo.Email,
                    Name = tokenInfo.Name,
                    Picture = tokenInfo.Picture
                };
            }
            catch
            {
                return null;
            }
        }
    }

    // Classes auxiliares para deserializar resposta do Google
    public class GoogleTokenInfo
    {
        public string Aud { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Picture { get; set; } = string.Empty;
    }

    public class GoogleUserInfo
    {
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Picture { get; set; } = string.Empty;
    }
}
