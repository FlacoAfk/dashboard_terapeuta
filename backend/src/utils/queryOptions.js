function toPositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePagination(query = {}, defaults = {}) {
    const page = Math.max(1, toPositiveInteger(query.page, defaults.page || 1));
    const defaultLimit = defaults.limit || 25;
    const maxLimit = defaults.maxLimit || 200;
    const limit = Math.min(maxLimit, Math.max(1, toPositiveInteger(query.limit, defaultLimit)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return {
        page,
        limit,
        from,
        to
    };
}

function parseSearch(query = {}, key = 'search') {
    const raw = query[key];
    if (typeof raw !== 'string') {
        return null;
    }

    const normalized = raw.trim();
    return normalized.length > 0 ? normalized : null;
}

function parseSort(query = {}, allowedFields = [], defaultSort = []) {
    const rawSort = typeof query.sort === 'string' ? query.sort.trim() : '';
    const normalizedDefaults = defaultSort.filter((item) => allowedFields.includes(item.field));

    if (!rawSort) {
        return normalizedDefaults;
    }

    const clauses = rawSort
        .split(',')
        .map((segment) => segment.trim())
        .filter(Boolean)
        .map((segment) => {
            const [field, direction] = segment.split(':').map((part) => part.trim());
            if (!allowedFields.includes(field)) return null;

            const normalizedDirection = String(direction || 'asc').toLowerCase();
            return {
                field,
                ascending: normalizedDirection !== 'desc'
            };
        })
        .filter(Boolean);

    if (clauses.length === 0) {
        return normalizedDefaults;
    }

    return clauses;
}

function applySortClauses(queryBuilder, sortClauses = []) {
    let query = queryBuilder;

    for (const clause of sortClauses) {
        query = query.order(clause.field, { ascending: clause.ascending });
    }

    return query;
}

function buildPaginationMetadata({ page, limit, total }) {
    const normalizedTotal = Number.isFinite(total) ? total : 0;
    const totalPages = normalizedTotal === 0 ? 0 : Math.ceil(normalizedTotal / limit);

    return {
        page,
        limit,
        total: normalizedTotal,
        totalPages,
        hasNextPage: totalPages > 0 && page < totalPages,
        hasPrevPage: page > 1
    };
}

module.exports = {
    parsePagination,
    parseSearch,
    parseSort,
    applySortClauses,
    buildPaginationMetadata,
    toPositiveInteger
};