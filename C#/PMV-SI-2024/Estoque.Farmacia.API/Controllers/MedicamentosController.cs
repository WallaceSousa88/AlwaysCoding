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
    public class MedicamentosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MedicamentosController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Medicamentos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> ObterTodos()
        {
            var medicamentos = await _context.Medicamentos
                .Join(_context.Fornecedores,
                      m => m.FornecedorId,
                      f => f.Id,
                      (m, f) => new { Medicamento = m, Fornecedor = f })
                .ToListAsync();

            return Ok(medicamentos);
        }

        // GET: api/Medicamentos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object?>> ObterPorId(int id)
        {
            var medicamento = await _context.Medicamentos
                .Where(m => m.Id == id)
                .Join(_context.Fornecedores,
                      m => m.FornecedorId,
                      f => f.Id,
                      (m, f) => new { Medicamento = m, Fornecedor = f })
                .FirstOrDefaultAsync();

            if (medicamento == null)
            {
                return NotFound();
            }

            return Ok(medicamento);
        }

        // POST: api/Medicamentos
        [HttpPost]
        public async Task<ActionResult<Medicamento>> Criar([Bind("NomeComercial, PrecoCusto, PrecoVenda, FornecedorId")] Medicamento medicamento)
        {
            _context.Medicamentos.Add(medicamento);
            await _context.SaveChangesAsync();

            return CreatedAtAction("ObterPorId", new { id = medicamento.Id }, medicamento);
        }

        // PUT: api/Medicamentos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(int id, Medicamento medicamento)
        {
            if (id != medicamento.Id)
            {
                return BadRequest();
            }

            _context.Entry(medicamento).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MedicamentoExists(id))
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

        // DELETE: api/Medicamentos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(int id)
        {
            var medicamento = await _context.Medicamentos.FindAsync(id);
            if (medicamento == null)
            {
                return NotFound();
            }

            _context.Medicamentos.Remove(medicamento);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MedicamentoExists(int id)
        {
            return _context.Medicamentos.Any(e => e.Id == id);
        }
    }
}