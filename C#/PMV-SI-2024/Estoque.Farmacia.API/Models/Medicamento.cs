namespace Estoque.Farmacia.API.Models {
    public class Medicamento
    {
        public int Id { get; set; }
        public string NomeComercial { get; set; }
        public decimal PrecoCusto { get; set; }
        public decimal PrecoVenda { get; set; }

        public int? FornecedorId { get; set; }
    }
}