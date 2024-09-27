using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Estoque.Farmacia.API.Migrations
{
    /// <inheritdoc />
    public partial class MedicamentoIdNulavel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lotes_Medicamentos_MedicamentoId",
                table: "Lotes");

            migrationBuilder.AlterColumn<int>(
                name: "MedicamentoId",
                table: "Lotes",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddForeignKey(
                name: "FK_Lotes_Medicamentos_MedicamentoId",
                table: "Lotes",
                column: "MedicamentoId",
                principalTable: "Medicamentos",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Lotes_Medicamentos_MedicamentoId",
                table: "Lotes");

            migrationBuilder.AlterColumn<int>(
                name: "MedicamentoId",
                table: "Lotes",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Lotes_Medicamentos_MedicamentoId",
                table: "Lotes",
                column: "MedicamentoId",
                principalTable: "Medicamentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
