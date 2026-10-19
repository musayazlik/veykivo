using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Veykivo.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddConcurrencyAndFileDeletionQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Technologies",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "TeamMembers",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Services",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Projects",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Posts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            // Mevcut kayıtlar boş GUID yerine benzersiz bir sürümle başlasın.
            foreach (var table in new[] { "Technologies", "TeamMembers", "Services", "Projects", "Posts" })
                migrationBuilder.Sql($"UPDATE \"{table}\" SET \"Version\" = gen_random_uuid();");

            migrationBuilder.CreateTable(
                name: "PendingFileDeletions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingFileDeletions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingFileDeletions_CreatedAt",
                table: "PendingFileDeletions",
                column: "CreatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingFileDeletions");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Technologies");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "TeamMembers");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Posts");
        }
    }
}
