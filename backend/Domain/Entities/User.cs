namespace MyWallet.API.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string GoogleId { get; set; } = string.Empty; // O ID único que vem do Google
    public string? AvatarUrl { get; set; } // Foto do perfil do Google

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>(); // Suas Metas (CNH, AP)
}