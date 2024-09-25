using System.ComponentModel.DataAnnotations;

namespace Estoque.Farmacia.API.Models
{
    public class Usuario
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome de usuário é obrigatório")]
        public string NomeUsuario { get; set; }

        [Required(ErrorMessage = "A senha é obrigatória")]
        [StringLength(100, ErrorMessage = "A senha deve ter entre 6 e 100 caracteres", MinimumLength = 6)]
        public string Senha { get; set; }
    }
}