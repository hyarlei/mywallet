using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MyWallet.API.Controllers;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using MyWallet.Tests.Helpers;
using Xunit;

namespace MyWallet.Tests.Controllers
{
    public class DashboardControllerTests
    {
        private readonly Guid _testUserId = Guid.NewGuid();

        [Fact]
        public async Task GetDashboard_WithNoTransactions_ShouldReturnZeros()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            var controller = new DashboardController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetDashboard();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var summary = okResult!.Value as DashboardResponseDto;
            
            summary.Should().NotBeNull();
            summary!.TotalIncome.Should().Be(0);
            summary.TotalExpense.Should().Be(0);
            summary.Balance.Should().Be(0);
        }

        [Fact]
        public async Task GetDashboard_WithIncomeAndExpenses_ShouldCalculateCorrectly()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var incomeCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Salário",
                Type = TransactionType.Income,
                Color = "#10b981",
                Icon = "banknote",
                UserId = _testUserId
            };

            var expenseCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Alimentação",
                Type = TransactionType.Expense,
                Color = "#ef4444",
                Icon = "utensils",
                UserId = _testUserId
            };

            await context.Categories.AddRangeAsync(incomeCategory, expenseCategory);

            var transactions = new List<Transaction>
            {
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    Description = "Salário",
                    Amount = 5000,
                    Type = TransactionType.Income,
                    Date = DateTime.UtcNow,
                    UserId = _testUserId,
                    CategoryId = incomeCategory.Id,
                    IsPaid = true
                },
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    Description = "Almoço",
                    Amount = 150,
                    Type = TransactionType.Expense,
                    Date = DateTime.UtcNow,
                    UserId = _testUserId,
                    CategoryId = expenseCategory.Id,
                    IsPaid = true
                },
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    Description = "Supermercado",
                    Amount = 350,
                    Type = TransactionType.Expense,
                    Date = DateTime.UtcNow,
                    UserId = _testUserId,
                    CategoryId = expenseCategory.Id,
                    IsPaid = true
                }
            };

            await context.Transactions.AddRangeAsync(transactions);
            await context.SaveChangesAsync();

            var controller = new DashboardController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetDashboard();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var summary = okResult!.Value as DashboardResponseDto;
            
            summary.Should().NotBeNull();
            summary!.TotalIncome.Should().Be(5000);
            summary.TotalExpense.Should().Be(500);
            summary.Balance.Should().Be(4500);
        }

        [Fact]
        public async Task GetDashboard_WithNegativeBalance_ShouldCalculateCorrectly()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var incomeCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Salário",
                Type = TransactionType.Income,
                Color = "#10b981",
                Icon = "banknote",
                UserId = _testUserId
            };

            var expenseCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Despesas",
                Type = TransactionType.Expense,
                Color = "#ef4444",
                Icon = "credit-card",
                UserId = _testUserId
            };

            await context.Categories.AddRangeAsync(incomeCategory, expenseCategory);

            var transactions = new List<Transaction>
            {
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    Description = "Salário",
                    Amount = 2000,
                    Type = TransactionType.Income,
                    Date = DateTime.UtcNow,
                    UserId = _testUserId,
                    CategoryId = incomeCategory.Id,
                    IsPaid = true
                },
                new Transaction
                {
                    Id = Guid.NewGuid(),
                    Description = "Despesas Grandes",
                    Amount = 5000,
                    Type = TransactionType.Expense,
                    Date = DateTime.UtcNow,
                    UserId = _testUserId,
                    CategoryId = expenseCategory.Id,
                    IsPaid = true
                }
            };

            await context.Transactions.AddRangeAsync(transactions);
            await context.SaveChangesAsync();

            var controller = new DashboardController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetDashboard();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var summary = okResult!.Value as DashboardResponseDto;
            
            summary.Should().NotBeNull();
            summary!.TotalIncome.Should().Be(2000);
            summary.TotalExpense.Should().Be(5000);
            summary.Balance.Should().Be(-3000);
        }
    }
}
