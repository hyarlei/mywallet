namespace MyWallet.API.DTOs
{
    public record GoogleAuthRequest(string IdToken);
    
    public record AuthResponse(
        string Token,
        Guid UserId,
        string Email,
        string Name
    );
}
