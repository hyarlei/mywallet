using System.ComponentModel.DataAnnotations;

namespace MyWallet.API.DTOs
{
    // DTO para criar/atualizar meta
    public record CreateGoalDto(
        [Required] string Title,
        [Required] decimal TargetAmount,
        decimal CurrentAmount,
        DateTime? Deadline,
        [Required] Guid UserId
    );

    // DTO para resposta
    public record GoalDto(
        Guid Id,
        string Title,
        decimal TargetAmount,
        decimal CurrentAmount,
        decimal Progress, // Percentual calculado
        DateTime? Deadline,
        Guid UserId,
        DateTime CreatedAt
    );

    // DTO para adicionar/remover valor da meta
    public record UpdateGoalAmountDto(
        [Required] decimal Amount,
        [Required] bool IsAddition // true = adicionar, false = remover
    );
}
