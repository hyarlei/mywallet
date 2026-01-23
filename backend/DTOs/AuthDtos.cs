using System.ComponentModel.DataAnnotations;

namespace MyWallet.API.DTOs
{
    public record GoogleAuthRequest(
        [Required(ErrorMessage = "O token do Google é obrigatório")]
        [MinLength(100, ErrorMessage = "Token inválido")]
        string IdToken
    );
    
    public record AuthResponse(
        string Token,
        Guid UserId,
        string Email,
        string Name
    );
}
