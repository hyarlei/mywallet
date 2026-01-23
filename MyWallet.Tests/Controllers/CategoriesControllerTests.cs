using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MyWallet.API.Controllers;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using MyWallet.Tests.Helpers;
using Xunit;

namespace MyWallet.Tests.Controllers
{
    public class CategoriesControllerTests
    {
        private readonly Guid _testUserId = Guid.NewGuid();

        [Fact]
        public async Task GetAll_ShouldReturnUserCategories()
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
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetAll();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var categories = okResult!.Value as IEnumerable<CategoryDto>;
            
            categories.Should().NotBeNull();
            categories.Should().HaveCount(1);
        }

        [Fact]
        public async Task Create_WithValidData_ShouldCreateCategory()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            var controller = new CategoriesController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new CreateCategoryDto(
                Name: "Transporte",
                Type: TransactionType.Expense,
                Color: "#3b82f6",
                Icon: "car",
                UserId: _testUserId
            );

            // Act
            var result = await controller.Create(dto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            context.Categories.Should().HaveCount(1);
        }

        [Fact]
        public async Task Create_WithDuplicateName_ShouldReturnBadRequest()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var existingCategory = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Alimentação",
                Type = TransactionType.Expense,
                Color = "#ef4444",
                Icon = "utensils",
                UserId = _testUserId
            };

            await context.Categories.AddAsync(existingCategory);
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new CreateCategoryDto(
                Name: "Alimentação",
                Type: TransactionType.Expense,
                Color: "#000000",
                Icon: "utensils",
                UserId: _testUserId
            );

            // Act
            var result = await controller.Create(dto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        [Fact]
        public async Task Delete_WithValidId_ShouldDeleteCategory()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var category = new Category
            {
                Id = Guid.NewGuid(),
                Name = "Temporária",
                Type = TransactionType.Expense,
                Color = "#000000",
                Icon = "trash",
                UserId = _testUserId
            };

            await context.Categories.AddAsync(category);
            await context.SaveChangesAsync();

            var controller = new CategoriesController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.Delete(category.Id);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            context.Categories.Should().BeEmpty();
        }
    }
}
