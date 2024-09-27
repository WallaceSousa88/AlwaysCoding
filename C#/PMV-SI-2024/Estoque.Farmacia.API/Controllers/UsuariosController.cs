using Estoque.Farmacia.API.Data;
using Estoque.Farmacia.API.Models;
using Estoque.Farmacia.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Estoque.Farmacia.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly AutenticacaoService _autenticacaoService;

        public UsuariosController(AppDbContext context, AutenticacaoService autenticacaoService)
        {
            _context = context;
            _autenticacaoService = autenticacaoService;
        }

        // POST: api/Usuarios/Autenticar
        [HttpPost("Autenticar")]
        public async Task<ActionResult<string>> Autenticar(Usuario usuario)
        {
            var usuarioAutenticado = await _autenticacaoService.AutenticarUsuario(usuario.NomeUsuario, usuario.Senha);

            if (usuarioAutenticado == null)
            {
                return BadRequest("Nome de usuário ou senha inválidos.");
            }

            var token = _autenticacaoService.GerarJwtToken(usuarioAutenticado);
            return Ok(token);
        }

        // POST: api/Usuarios
        [HttpPost]
        public async Task<ActionResult<Usuario>> CriarUsuario(Usuario usuario)
        {
            if (await _context.Usuarios.AnyAsync(u => u.NomeUsuario == usuario.NomeUsuario))
            {
                return BadRequest("Nome de usuário já existe.");
            }

            usuario.Senha = AutenticacaoService.GerarHashSenha(usuario.Senha);
            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return CreatedAtRoute("ObterUsuario", new { id = usuario.Id }, usuario);
        }

        // GET: api/Usuarios
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Usuario>>> ObterUsuarios()
        {
            return await _context.Usuarios.Select(u => new Usuario
            {
                Id = u.Id,
                NomeUsuario = u.NomeUsuario
            }).ToListAsync();
        }

        // GET: api/Usuarios/5
        [HttpGet("{id}", Name = "ObterUsuario")]
        public async Task<ActionResult<Usuario>> ObterUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);

            if (usuario == null)
            {
                return NotFound();
            }

            return new Usuario { Id = usuario.Id, NomeUsuario = usuario.NomeUsuario };
        }

        // PUT: api/Usuarios/5
        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarUsuario(int id, Usuario usuario)
        {
            if (id != usuario.Id)
            {
                return BadRequest();
            }

            if (await _context.Usuarios.AnyAsync(u => u.NomeUsuario == usuario.NomeUsuario && u.Id != id))
            {
                return BadRequest("Nome de usuário já existe.");
            }

            var usuarioExistente = await _context.Usuarios.FindAsync(id);
            if (usuarioExistente == null)
            {
                return NotFound();
            }
            usuarioExistente.NomeUsuario = usuario.NomeUsuario;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UsuarioExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Usuarios/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null)
            {
                return NotFound();
            }

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UsuarioExists(int id)
        {
            return _context.Usuarios.Any(e => e.Id == id);
        }
    }
}