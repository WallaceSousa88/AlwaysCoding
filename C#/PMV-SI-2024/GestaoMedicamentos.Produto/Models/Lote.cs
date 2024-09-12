namespace GestaoMedicamentos.Produto.Models
{
    public class Lote
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public string NumeroLote { get; set; }
        public DateTime Validade { get; set; }
        public int Quantidade { get; set; }

        public Produto Produto { get; set; }
    }
}