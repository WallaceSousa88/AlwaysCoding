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
    public class LotesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LotesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Lotes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Lote>>> ObterTodos()
        {
            return await _context.Lotes
                .Include(l => l.Medicamento)
                .ToListAsync();
        }

        // GET: api/Lotes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Lote>> ObterPorId(int id)
        {
            var lote = await _context.Lotes
                .Include(l => l.Medicamento)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (lote == null)
            {
                return NotFound();
            }

            return lote;
        }

        // POST: api/Lotes
        [HttpPost]
        public async Task<ActionResult<Lote>> Criar(Lote lote)
        {
            _context.Lotes.Add(lote);
            await _context.SaveChangesAsync();

            return CreatedAtAction("ObterPorId", new { id = lote.Id }, lote);
        }

        // PUT: api/Lotes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, Lote lote)
        {
            if (id != lote.Id)
            {
                return BadRequest();
            }

            _context.Entry(lote).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LoteExists(id))
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

        // DELETE: api/Lotes/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(int id)
        {
            var lote = await _context.Lotes.FindAsync(id);
            if (lote == null)
            {
                return NotFound();
            }

            _context.Lotes.Remove(lote);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool LoteExists(int id)
        {
            return _context.Lotes.Any(e => e.Id == id);
        }
    }
}