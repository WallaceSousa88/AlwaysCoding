public class Medicamento
{
    public int Id { get; set; }
    public string NomeComercial { get; set; }
    public decimal PrecoCusto { get; set; }
    public decimal PrecoVenda { get; set; }

    public int FornecedorId { get; set; } // Chave estrangeira
    public Fornecedor Fornecedor { get; set; } // Relacionamento N:1

    public ICollection<Lote> Lotes { get; set; } // Relacionamento 1:N
}