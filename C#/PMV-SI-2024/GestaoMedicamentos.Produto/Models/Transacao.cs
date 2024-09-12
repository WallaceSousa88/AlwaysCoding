namespace GestaoMedicamentos.Produto.Models
{
    public class Transacao
    {
        public int Id { get; set; }
        public int LoteId { get; set; }  // Chave estrangeira para Lote
        public string Tipo { get; set; } // 'entrada' ou 'retirada'
        public int Quantidade { get; set; }
        public DateTime DataTransacao { get; set; }

        // Propriedade de navegação para Lote (opcional, mas útil)
        public Lote Lote { get; set; }
    }
}