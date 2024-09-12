using Microsoft.EntityFrameworkCore;
using GestaoMedicamentos.Produto.Models;

namespace GestaoMedicamentos.Produto.Data
{
    public class MedicamentosContext : DbContext
    {
        public MedicamentosContext(DbContextOptions<MedicamentosContext> options)
            : base(options)
        {
        }

        public DbSet<GestaoMedicamentos.Produto.Models.Produto> Produtos { get; set; }
        public DbSet<GestaoMedicamentos.Produto.Models.Lote> Lotes { get; set; }
        public DbSet<GestaoMedicamentos.Produto.Models.Transacao> Transacoes { get; set; }
    }
}
