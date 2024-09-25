using Estoque.Farmacia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Estoque.Farmacia.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer("Server=MICP5300116115;Database=EstoqueFarmacia;Trusted_Connection=True;TrustServerCertificate=True;");
            }
        }

        public DbSet<Fornecedor> Fornecedores { get; set; }
        public DbSet<Medicamento> Medicamentos { get; set; }
        public DbSet<Lote> Lotes { get; set; }
        public DbSet<Entrada> Entradas { get; set; }
        public DbSet<Saida> Saidas { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Relacionamento entre Fornecedor e Medicamento (1:N)
            modelBuilder.Entity<Fornecedor>()
                .HasMany(f => f.Medicamentos)
                .WithOne(m => m.Fornecedor)
                .HasForeignKey(m => m.FornecedorId);

            // Relacionamento entre Medicamento e Lote (1:N)
            modelBuilder.Entity<Medicamento>()
                .HasMany(m => m.Lotes)
                .WithOne(l => l.Medicamento)
                .HasForeignKey(l => l.MedicamentoId);

            // Relacionamento entre Lote e Entrada (1:N)
            modelBuilder.Entity<Lote>()
                .HasMany(l => l.Entradas)
                .WithOne(e => e.Lote)
                .HasForeignKey(e => e.LoteId);

            // Relacionamento entre Lote e Saida (1:N)
            modelBuilder.Entity<Lote>()
                .HasMany(l => l.Saidas)
                .WithOne(s => s.Lote)
                .HasForeignKey(s => s.LoteId);
        }
    }
}