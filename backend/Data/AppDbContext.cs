using Microsoft.EntityFrameworkCore;
using MyWallet.API.Domain.Entities; // Ajuste para o namespace correto das suas entidades

namespace MyWallet.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Aqui definimos as Tabelas
        public DbSet<User> Users { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Category> Categories { get; set; } // Não esqueça de criar a classe Category também!
        public DbSet<Goal> Goals { get; set; }

        // Configurações finas (Fluent API)
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Exemplo: Garantir que o E-mail seja único no banco
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Exemplo: Configurar precisão do dinheiro (DECIMAL) para evitar erros de arredondamento
            modelBuilder.Entity<Transaction>()
                .Property(t => t.Amount)
                .HasPrecision(18, 2); // 18 dígitos, 2 decimais

            modelBuilder.Entity<Goal>()
                .Property(g => g.TargetAmount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Goal>()
                .Property(g => g.CurrentAmount)
                .HasPrecision(18, 2);
        }
    }
}