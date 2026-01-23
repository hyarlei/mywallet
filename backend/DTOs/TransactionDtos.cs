using System.ComponentModel.DataAnnotations; // Para validações automáticas
using MyWallet.API.Domain.Entities; // Ajuste para seu namespace

namespace MyWallet.API.DTOs
{
    // O que o Front manda para CRIAR uma transação
    public record CreateTransactionDto(
        [Required(ErrorMessage = "A descrição é obrigatória")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "A descrição deve ter entre 3 e 200 caracteres")]
        string Description,
        
        [Required(ErrorMessage = "O valor é obrigatório")]
        [Range(0.01, 999999999.99, ErrorMessage = "O valor deve estar entre 0.01 e 999.999.999,99")]
        decimal Amount,
        
        [Required(ErrorMessage = "A data é obrigatória")]
        DateTime Date,
        
        [Required(ErrorMessage = "O tipo é obrigatório")]
        [EnumDataType(typeof(TransactionType), ErrorMessage = "Tipo de transação inválido")]
        TransactionType Type,
        
        [Required(ErrorMessage = "A categoria é obrigatória")]
        Guid CategoryId,
        
        [Required(ErrorMessage = "O usuário é obrigatório")]
        Guid UserId // Temporário: Depois pegaremos do Token de Auth
    );

    // O que o Back devolve para o Front MOSTRAR na tela
    public record TransactionDto(
        Guid Id,
        string Description,
        decimal Amount,
        string Type, // Devolvemos string ("Income") em vez de número (1) pra facilitar o front
        DateTime Date,
        string CategoryName, // Já mandamos o nome da categoria pronto
        Guid CategoryId, // Adiciona o CategoryId para edição
        bool IsPaid
    );

    public record DashboardResponseDto(
    decimal TotalIncome,   // Total Entradas
    decimal TotalExpense,  // Total Saídas
    decimal Balance        // Saldo (Entrada - Saída)
);
}