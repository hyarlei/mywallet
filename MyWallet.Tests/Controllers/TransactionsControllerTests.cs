using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MyWallet.API.Controllers;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using MyWallet.Tests.Helpers;
using Xunit;

namespace MyWallet.Tests.Controllers
{
    public class TransactionsControllerTests
    {
        private readonly Guid _testUserId = Guid.NewGuid();

        [Fact]
        public async Task GetAll_ShouldReturnOnlyUserTransactions()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Salário",
                Type = TransactionType.Income,
                Color = "#10b981",
                Icon = "banknote",
                UserId = _testUserId
            };

            await context.Categories.AddAsync(category);

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                Description = "Salário Janeiro",
                Amount = 5000,
                Type = TransactionType.Income,
                Date = DateTime.UtcNow,
                UserId = _testUserId,
                CategoryId = category.Id,
                IsPaid = true
            };

            await context.Transactions.AddAsync(transaction);
            await context.SaveChangesAsync();

            var controller = new TransactionsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetAll();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var transactions = okResult!.Value as IEnumerable<TransactionDto>;
            
            transactions.Should().NotBeNull();
            transactions.Should().HaveCount(1);
            transactions!.First().Description.Should().Be("Salário Janeiro");
        }

        [Fact]
        public async Task Create_WithValidData_ShouldCreateTransaction()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Alimentação",
                Type = TransactionType.Expense,
                Color = "#ef4444",
                Icon = "utensils",
                UserId = _testUserId
            };

            await context.Categories.AddAsync(category);
            await context.SaveChangesAsync();

            var controller = new TransactionsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new CreateTransactionDto(
                Description: "Almoço",
                Amount: 50,
                Date: DateTime.UtcNow,
                Type: TransactionType.Expense,
                CategoryId: category.Id,
                UserId: _testUserId
            );

            // Act
            var result = await controller.Create(dto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            context.Transactions.Should().HaveCount(1);
        }

        [Fact]
        public async Task Create_WithInvalidAmount_ShouldReturnBadRequest()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            var controller = new TransactionsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new CreateTransactionDto(
                Description: "Test",
                Amount: 0,
                Date: DateTime.UtcNow,
                Type: TransactionType.Expense,
                CategoryId: Guid.NewGuid(),
                UserId: _testUserId
            );

            // Act
            var result = await controller.Create(dto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Delete_WithValidId_ShouldDeleteTransaction()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Test",
                Type = TransactionType.Income,
                Color = "#000000",
                Icon = "test",
                UserId = _testUserId
            };

            await context.Categories.AddAsync(category);

            var transaction = new Transaction
            {
                Id = Guid.NewGuid(),
                Description = "Test",
                Amount = 100,
                Type = TransactionType.Income,
                Date = DateTime.UtcNow,
                UserId = _testUserId,
                CategoryId = category.Id,
                IsPaid = true
            };

            await context.Transactions.AddAsync(transaction);
            await context.SaveChangesAsync();

            var controller = new TransactionsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.Delete(transaction.Id);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            context.Transactions.Should().BeEmpty();
        }
    }
}
