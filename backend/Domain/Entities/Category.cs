namespace MyWallet.API.Domain.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty; // Ex: "Freelas", "Salário", "Transporte"
    public string Icon { get; set; } = string.Empty; // Para guardar o nome do ícone
    public string Color { get; set; } = "#000000"; // Cor hexadecimal
    public TransactionType Type { get; set; } // Para saber se é de Entrada ou Saída

    // Chave Estrangeira
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
