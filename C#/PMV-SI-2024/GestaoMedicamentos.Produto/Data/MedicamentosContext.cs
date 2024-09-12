using Microsoft.EntityFrameworkCore;

namespace GestaoMedicamentos.Produto.Data
{
    public class MedicamentosContext : DbContext
    {
        public MedicamentosContext(DbContextOptions<MedicamentosContext> options)
            : base(options)
        {
        }

        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Lote> Lotes { get; set; }
        public DbSet<Transacao> Transacoes { get; set; }
    }
}