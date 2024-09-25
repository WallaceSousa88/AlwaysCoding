using Estoque.Farmacia.API.Data;
using Estoque.Farmacia.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Estoque.Farmacia.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EntradasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EntradasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Entradas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Entrada>>> ObterTodos()
        {
            return await _context.Entradas.Include(e => e.Lote).ToListAsync();
        }

        // GET: api/Entradas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Entrada>> ObterPorId(int id)
        {
            var entrada = await _context.Entradas
                .Include(e => e.Lote)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (entrada == null)
            {
                return NotFound();
            }

            return entrada;
        }

        // POST: api/Entradas
        [HttpPost]
        public async Task<ActionResult<Entrada>> Criar(Entrada entrada)
        {
            _context.Entradas.Add(entrada);
            await _context.SaveChangesAsync();

            return CreatedAtAction("ObterPorId", new { id = entrada.Id }, entrada);
        }

        // PUT: api/Entradas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, Entrada entrada)
        {
            if (id != entrada.Id)
            {
                return BadRequest();
            }

            _context.Entry(entrada).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EntradaExists(id))
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

        // DELETE: api/Entradas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(int id)
        {
            var entrada = await _context.Entradas.FindAsync(id);
            if (entrada == null)
            {
                return NotFound();
            }

            _context.Entradas.Remove(entrada);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EntradaExists(int id)
        {
            return _context.Entradas.Any(e => e.Id == id);
        }
    }
}