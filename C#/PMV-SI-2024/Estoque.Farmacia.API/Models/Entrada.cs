namespace Estoque.Farmacia.API.Models {
    public class Entrada
    {
        public int Id { get; set; }
        public DateTime DataEntrada { get; set; }
        public int QuantidadeRecebida { get; set; }

        public int LoteId { get; set; } // Chave estrangeira
    }
}