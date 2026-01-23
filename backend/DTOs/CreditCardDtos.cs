using System.ComponentModel.DataAnnotations;

namespace MyWallet.API.DTOs
{
    // DTO para criar/atualizar cartão
    public record CreateCreditCardDto(
        [Required(ErrorMessage = "O nome do cartão é obrigatório")]
        [StringLength(100, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 100 caracteres")]
        string Name,
        
        [Required(ErrorMessage = "O banco é obrigatório")]
        [StringLength(50, ErrorMessage = "O banco deve ter no máximo 50 caracteres")]
        string Bank,
        
        [Required(ErrorMessage = "A bandeira é obrigatória")]
        [StringLength(50, ErrorMessage = "A bandeira deve ter no máximo 50 caracteres")]
        string Flag,
        
        [Required(ErrorMessage = "Os últimos 4 dígitos são obrigatórios")]
        [StringLength(4, MinimumLength = 4, ErrorMessage = "Devem ser exatamente 4 dígitos")]
        [RegularExpression(@"^\d{4}$", ErrorMessage = "Devem ser apenas números")]
        string Last4Digits,
        
        [Required(ErrorMessage = "O valor da fatura é obrigatório")]
        [Range(0, 999999999.99, ErrorMessage = "O valor deve estar entre 0 e 999.999.999,99")]
        decimal CurrentBill,
        
        [Range(0, 999999999.99, ErrorMessage = "O limite deve estar entre 0 e 999.999.999,99")]
        decimal? CreditLimit,
        
        [Range(1, 31, ErrorMessage = "O dia de vencimento deve estar entre 1 e 31")]
        int? DueDay,
        
        [Required(ErrorMessage = "O usuário é obrigatório")]
        Guid UserId
    );

    // DTO para resposta
    public record CreditCardDto(
        Guid Id,
        string Name,
        string Bank,
        string Flag,
        string Last4Digits,
        decimal CurrentBill,
        decimal? CreditLimit,
        int? DueDay,
        Guid UserId,
        DateTime CreatedAt
    );

    // DTO para atualizar apenas o valor da fatura
    public record UpdateBillDto(
        [Required(ErrorMessage = "O valor é obrigatório")]
        [Range(0, 999999999.99, ErrorMessage = "O valor deve estar entre 0 e 999.999.999,99")]
        decimal CurrentBill
    );
}
