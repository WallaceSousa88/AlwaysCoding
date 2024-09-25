using Estoque.Farmacia.API.Data;
using Estoque.Farmacia.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;

namespace Estoque.Farmacia.API.Services
{
    public class AutenticacaoService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AutenticacaoService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<Usuario> AutenticarUsuario(string nomeUsuario, string senha)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.NomeUsuario == nomeUsuario);

            if (usuario == null || !VerificarSenhaHash(senha, usuario.Senha))
            {
                return null;
            }

            return usuario;
        }

        public string GerarJwtToken(Usuario usuario)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration.GetSection("AppSettings:Secret").Value);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, usuario.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private static bool VerificarSenhaHash(string senha, string senhaHash)
        {
            using (var sha256 = SHA256.Create())
            {
                var senhaInputBytes = Encoding.UTF8.GetBytes(senha);
                var senhaHashBytes = Convert.FromBase64String(senhaHash);
                var senhaInputHashBytes = sha256.ComputeHash(senhaInputBytes);

                for (int i = 0; i < senhaInputHashBytes.Length; i++)
                {
                    if (senhaInputHashBytes[i] != senhaHashBytes[i])
                    {
                        return false;
                    }
                }

                return true;
            }
        }

        public static string GerarHashSenha(string senha)
        {
            using (var sha256 = SHA256.Create())
            {
                var senhaBytes = Encoding.UTF8.GetBytes(senha);
                var hashBytes = sha256.ComputeHash(senhaBytes);
                return Convert.ToBase64String(hashBytes);
            }
        }
    }
}