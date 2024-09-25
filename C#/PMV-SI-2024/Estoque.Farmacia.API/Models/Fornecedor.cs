namespace Estoque.Farmacia.API.Models {
    public class Fornecedor
    {
        public int Id { get; set; }
        public string NomeFantasia { get; set; }
        public string CNPJ { get; set; }
        public string Telefone { get; set; }
        public string Email { get; set; }

        public ICollection<Medicamento> Medicamentos { get; set; } // Relacionamento 1:N
    }
}