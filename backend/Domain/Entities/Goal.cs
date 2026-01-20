namespace MyWallet.API.Domain.Entities;

public class Goal : BaseEntity
{
    public string Title { get; set; } = string.Empty; // Ex: "CNH", "Apartamento"
    public decimal TargetAmount { get; set; } // Meta: R$ 2.500,00
    public decimal CurrentAmount { get; set; } // Atual: R$ 500,00
    public DateTime? Deadline { get; set; } // Prazo: "Para ontem"

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
}