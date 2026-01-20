using System.ComponentModel.DataAnnotations; // Para validações automáticas
using MyWallet.API.Domain.Entities; // Ajuste para seu namespace

namespace MyWallet.API.DTOs
{
    // O que o Front manda para CRIAR uma transação
    public record CreateTransactionDto(
        [Required] string Description,
        [Required] decimal Amount,
        [Required] DateTime Date,
        [Required] TransactionType Type,
        [Required] Guid CategoryId,
        [Required] Guid UserId // Temporário: Depois pegaremos do Token de Auth
    );

    // O que o Back devolve para o Front MOSTRAR na tela
    public record TransactionDto(
        Guid Id,
        string Description,
        decimal Amount,
        string Type, // Devolvemos string ("Income") em vez de número (1) pra facilitar o front
        DateTime Date,
        string CategoryName, // Já mandamos o nome da categoria pronto
        bool IsPaid
    );

    public record DashboardResponseDto(
    decimal TotalIncome,   // Total Entradas
    decimal TotalExpense,  // Total Saídas
    decimal Balance        // Saldo (Entrada - Saída)
);
}