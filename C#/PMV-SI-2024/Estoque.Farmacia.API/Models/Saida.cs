namespace Estoque.Farmacia.API.Models {
    public class Saida
    {
        public int Id { get; set; }
        public DateTime DataSaida { get; set; }
        public int QuantidadeSaida { get; set; }

        public int LoteId { get; set; } // Chave estrangeira
        public Lote Lote { get; set; } // Relacionamento N:1
    }
}