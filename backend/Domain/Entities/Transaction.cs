namespace MyWallet.API.Domain.Entities;

public class Transaction : BaseEntity
{
    public string Description { get; set; } = string.Empty; // Ex: "Freela BarberFlow"
    public decimal Amount { get; set; } // Use DECIMAL para dinheiro (Float perde centavos)
    public DateTime Date { get; set; }
    public TransactionType Type { get; set; } // Enum: Income (Entrada) ou Expense (Saída)
    public bool IsPaid { get; set; } // Para controlar o "Aguardando" vs "Pago"

    // Chaves Estrangeiras
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    
    public Guid CategoryId { get; set; }
    public Category Category { get; set; } = null!;
}

// O Enum para ficar tipado
public enum TransactionType
{
    Income = 1,
    Expense = 2
}