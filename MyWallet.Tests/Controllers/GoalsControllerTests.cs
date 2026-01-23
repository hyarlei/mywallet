using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using MyWallet.API.Controllers;
using MyWallet.API.Domain.Entities;
using MyWallet.API.DTOs;
using MyWallet.Tests.Helpers;
using Xunit;

namespace MyWallet.Tests.Controllers
{
    public class GoalsControllerTests
    {
        private readonly Guid _testUserId = Guid.NewGuid();

        [Fact]
        public async Task GetAll_ShouldReturnUserGoals()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var goal = new Goal
            {
                Id = Guid.NewGuid(),
                Title = "Viagem",
                TargetAmount = 5000,
                CurrentAmount = 2000,
                UserId = _testUserId
            };

            await context.Goals.AddAsync(goal);
            await context.SaveChangesAsync();

            var controller = new GoalsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.GetAll(userId: null);

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = result.Result as OkObjectResult;
            var goals = okResult!.Value as IEnumerable<GoalDto>;
            
            goals.Should().NotBeNull();
            goals.Should().HaveCount(1);
        }

        [Fact]
        public async Task Create_WithValidData_ShouldCreateGoal()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            var controller = new GoalsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new CreateGoalDto(
                Title: "Viagem",
                TargetAmount: 5000,
                CurrentAmount: 0,
                Deadline: null,
                UserId: _testUserId
            );

            // Act
            var result = await controller.Create(dto);

            // Assert
            result.Should().BeOfType<CreatedAtActionResult>();
            context.Goals.Should().HaveCount(1);
        }

        [Fact]
        public async Task UpdateAmount_ShouldAddToCurrentAmount()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var goal = new Goal
            {
                Id = Guid.NewGuid(),
                Title = "Poupança",
                TargetAmount = 10000,
                CurrentAmount = 5000,
                UserId = _testUserId
            };

            await context.Goals.AddAsync(goal);
            await context.SaveChangesAsync();

            var controller = new GoalsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            var dto = new UpdateGoalAmountDto(
                Amount: 1000,
                IsAddition: true
            );

            // Act
            var result = await controller.UpdateAmount(goal.Id, dto);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            
            var updatedGoal = await context.Goals.FindAsync(goal.Id);
            updatedGoal!.CurrentAmount.Should().Be(6000);
        }

        [Fact]
        public async Task Delete_WithValidId_ShouldDeleteGoal()
        {
            // Arrange
            using var context = TestDbHelper.CreateInMemoryContext();
            
            var goal = new Goal
            {
                Id = Guid.NewGuid(),
                Title = "Temporária",
                TargetAmount = 1000,
                CurrentAmount = 500,
                UserId = _testUserId
            };

            await context.Goals.AddAsync(goal);
            await context.SaveChangesAsync();

            var controller = new GoalsController(context);
            ControllerHelper.SetupUserContext(controller, _testUserId);

            // Act
            var result = await controller.Delete(goal.Id);

            // Assert
            result.Should().BeOfType<OkObjectResult>();
            context.Goals.Should().BeEmpty();
        }
    }
}
