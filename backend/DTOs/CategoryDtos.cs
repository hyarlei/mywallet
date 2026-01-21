using System.ComponentModel.DataAnnotations;
using MyWallet.API.Domain.Entities;

namespace MyWallet.API.DTOs
{
    // DTO para criar/atualizar categoria
    public record CreateCategoryDto(
        [Required] string Name,
        [Required] TransactionType Type, // 1 = Income, 2 = Expense
        [Required] string Color,
        string? Icon,
        [Required] Guid UserId
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
