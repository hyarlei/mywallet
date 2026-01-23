namespace MyWallet.API.Domain.Entities
{
    public class CreditCard : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Bank { get; set; } = string.Empty; // nubank, itau, bb, etc
        public string Flag { get; set; } = string.Empty; // visa, master, elo, etc
        public string Last4Digits { get; set; } = string.Empty; // Últimos 4 dígitos
        public decimal CurrentBill { get; set; } // Valor da fatura atual
        public decimal? CreditLimit { get; set; } // Limite do cartão (opcional)
        public int? DueDay { get; set; } // Dia de vencimento (opcional)
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
    }
}
