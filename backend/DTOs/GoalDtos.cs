using System.ComponentModel.DataAnnotations;

namespace MyWallet.API.DTOs
{
    // DTO para criar/atualizar meta
    public record CreateGoalDto(
        [Required(ErrorMessage = "O título da meta é obrigatório")]
        [StringLength(100, MinimumLength = 3, ErrorMessage = "O título deve ter entre 3 e 100 caracteres")]
        string Title,
        
        [Required(ErrorMessage = "O valor alvo é obrigatório")]
        [Range(0.01, 999999999.99, ErrorMessage = "O valor alvo deve estar entre 0.01 e 999.999.999,99")]
        decimal TargetAmount,
        
        [Range(0, 999999999.99, ErrorMessage = "O valor atual deve estar entre 0 e 999.999.999,99")]
        decimal CurrentAmount,
        
        DateTime? Deadline,
        
        [Required(ErrorMessage = "O usuário é obrigatório")]
        Guid UserId
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
        [Required(ErrorMessage = "O valor é obrigatório")]
        [Range(0.01, 999999999.99, ErrorMessage = "O valor deve estar entre 0.01 e 999.999,99")]
        decimal Amount,
        
        [Required(ErrorMessage = "O tipo de operação é obrigatório")]
        bool IsAddition, // true = adicionar, false = remover
        
        [Required(ErrorMessage = "O usuário é obrigatório")]
        Guid UserId
    );
}
