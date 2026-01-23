using System.ComponentModel.DataAnnotations;
using MyWallet.API.Domain.Entities;

namespace MyWallet.API.DTOs
{
    // DTO para criar/atualizar categoria
    public record CreateCategoryDto(
        [Required(ErrorMessage = "O nome da categoria é obrigatório")]
        [StringLength(50, MinimumLength = 2, ErrorMessage = "O nome deve ter entre 2 e 50 caracteres")]
        string Name,
        
        [Required(ErrorMessage = "O tipo é obrigatório")]
        [EnumDataType(typeof(TransactionType), ErrorMessage = "Tipo inválido")]
        TransactionType Type, // 1 = Income, 2 = Expense
        
        [Required(ErrorMessage = "A cor é obrigatória")]
        [RegularExpression(@"^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$", ErrorMessage = "Formato de cor inválido. Use formato hexadecimal (#FFFFFF)")]
        string Color,
        
        [StringLength(50, ErrorMessage = "O ícone deve ter no máximo 50 caracteres")]
        string? Icon,
        
        [Required(ErrorMessage = "O usuário é obrigatório")]
        Guid UserId
    );

    // DTO para resposta
    public record CategoryDto(
        Guid Id,
        string Name,
        TransactionType Type,
        string Color,
        string? Icon,
        Guid UserId,
        DateTime CreatedAt
    );
}
