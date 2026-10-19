namespace Veykivo.Application.Common;

public readonly record struct Pagination(int Page, int PageSize, int Offset)
{
    public static Pagination Create(int page, int pageSize, int maxPageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, maxPageSize);
        var offset = (long)(page - 1) * pageSize;
        if (offset > 1_000_000) throw new BadRequestException("İstenen sayfa izin verilen aralığın dışında.");
        return new Pagination(page, pageSize, (int)offset);
    }
}
