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
    public class SaidasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SaidasController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Saidas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Saida>>> ObterTodos()
        {
            return await _context.Saidas.Include(s => s.Lote).ToListAsync();
        }

        // GET: api/Saidas/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Saida>> ObterPorId(int id)
        {
            var saida = await _context.Saidas
                .Include(s => s.Lote)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (saida == null)
            {
                return NotFound();
            }

            return saida;
        }

        // POST: api/Saidas
        [HttpPost]
        public async Task<ActionResult<Saida>> Criar(Saida saida)
        {
            _context.Saidas.Add(saida);
            await _context.SaveChangesAsync();

            return CreatedAtAction("ObterPorId", new { id = saida.Id }, saida);
        }

        // PUT: api/Saidas/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, Saida saida)
        {
            if (id != saida.Id)
            {
                return BadRequest();
            }

            _context.Entry(saida).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SaidaExists(id))
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

        // DELETE: api/Saidas/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(int id)
        {
            var saida = await _context.Saidas.FindAsync(id);
            if (saida == null)
            {
                return NotFound();
            }

            _context.Saidas.Remove(saida);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool SaidaExists(int id)
        {
            return _context.Saidas.Any(e => e.Id == id);
        }
    }
}