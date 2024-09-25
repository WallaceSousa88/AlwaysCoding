public class Entrada
{
    public int Id { get; set; }
    public DateTime DataEntrada { get; set; }
    public int QuantidadeRecebida { get; set; }

    public int LoteId { get; set; } // Chave estrangeira
    public Lote Lote { get; set; } // Relacionamento N:1
}