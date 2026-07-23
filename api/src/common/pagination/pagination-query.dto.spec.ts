import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
import { SortDirection } from './sort-direction.enum';

/**
 * `sortField`/`sortDirection` are REQUIRED on every paginated request (see
 * `PaginationQueryDto`) — a request missing either one must fail validation
 * (400 via the global `ValidationPipe`, `transform: true`, same as `main.ts`).
 * `page`/`pageSize` stay optional with their existing defaults.
 */
describe('PaginationQueryDto validation', () => {
  function toDto(query: Record<string, unknown>): PaginationQueryDto {
    return plainToInstance(PaginationQueryDto, query);
  }

  it('passes with both sortField and sortDirection present', async () => {
    const dto = toDto({
      page: '1',
      pageSize: '20',
      sortField: 'name',
      sortDirection: 'asc',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('passes with only sortField/sortDirection present (page/pageSize keep their defaults)', async () => {
    const dto = toDto({ sortField: 'name', sortDirection: 'asc' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('fails validation when sortField is missing', async () => {
    const dto = toDto({ sortDirection: 'asc' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'sortField')).toBe(true);
  });

  it('fails validation when sortDirection is missing', async () => {
    const dto = toDto({ sortField: 'name' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'sortDirection')).toBe(true);
  });

  it('fails validation when both sortField and sortDirection are missing', async () => {
    const dto = toDto({ page: '1', pageSize: '20' });

    const errors = await validate(dto);

    const invalidProperties = errors.map((e) => e.property);
    expect(invalidProperties).toEqual(
      expect.arrayContaining(['sortField', 'sortDirection']),
    );
  });

  it('fails validation when sortField is an empty string', async () => {
    const dto = toDto({ sortField: '', sortDirection: 'asc' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'sortField')).toBe(true);
  });

  it('fails validation when sortDirection is not "asc"/"desc"', async () => {
    const dto = toDto({ sortField: 'name', sortDirection: 'sideways' });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'sortDirection')).toBe(true);
  });

  it('accepts both allowed SortDirection values', async () => {
    for (const direction of Object.values(SortDirection)) {
      const dto = toDto({ sortField: 'name', sortDirection: direction });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    }
  });
});
