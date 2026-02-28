const test = require('node:test');
const assert = require('node:assert/strict');

const {
    parsePagination,
    parseSearch,
    parseSort,
    buildPaginationMetadata
} = require('../src/utils/queryOptions');

test('parsePagination aplica defaults y límites', () => {
    const result = parsePagination({ page: '0', limit: '999' }, {
        page: 1,
        limit: 25,
        maxLimit: 100
    });

    assert.equal(result.page, 1);
    assert.equal(result.limit, 100);
    assert.equal(result.from, 0);
    assert.equal(result.to, 99);
});

test('parseSearch normaliza texto vacío', () => {
    assert.equal(parseSearch({ search: '   ' }), null);
    assert.equal(parseSearch({ search: '  juan  ' }), 'juan');
});

test('parseSort soporta múltiples criterios y fallback', () => {
    const allowed = ['created_at', 'nombre', 'edad'];
    const defaultSort = [{ field: 'created_at', ascending: false }];

    const parsed = parseSort({ sort: 'nombre:asc,edad:desc,foo:asc' }, allowed, defaultSort);
    assert.deepEqual(parsed, [
        { field: 'nombre', ascending: true },
        { field: 'edad', ascending: false }
    ]);

    const fallback = parseSort({ sort: 'foo:asc' }, allowed, defaultSort);
    assert.deepEqual(fallback, defaultSort);
});

test('buildPaginationMetadata calcula banderas de navegación', () => {
    const meta = buildPaginationMetadata({ page: 2, limit: 10, total: 23 });

    assert.equal(meta.totalPages, 3);
    assert.equal(meta.hasNextPage, true);
    assert.equal(meta.hasPrevPage, true);
});