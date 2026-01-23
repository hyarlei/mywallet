using Microsoft.EntityFrameworkCore;
using MyWallet.API.Data;

namespace MyWallet.Tests.Helpers
{
    public static class TestDbHelper
    {
        public static AppDbContext CreateInMemoryContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }
    }
}
