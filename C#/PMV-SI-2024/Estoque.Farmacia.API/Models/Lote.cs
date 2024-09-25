namespace Estoque.Farmacia.API.Models {
    public class Lote
    {
        public int Id { get; set; }
        public int Quantidade { get; set; }
        public DateTime DataFabricacao { get; set; }
        public DateTime DataValidade { get; set; }

        public int MedicamentoId { get; set; } // Chave estrangeira
        public Medicamento Medicamento { get; set; } // Relacionamento N:1

        public ICollection<Entrada> Entradas { get; set; } // Relacionamento 1:N
        public ICollection<Saida> Saidas { get; set; } // Relacionamento 1:N
    }
}