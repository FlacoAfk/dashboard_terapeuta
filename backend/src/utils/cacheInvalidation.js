const { invalidateCacheByPattern } = require('./cache');

async function invalidatePatientCaches() {
    await Promise.all([
        invalidateCacheByPattern('api:patients:list:*'),
        invalidateCacheByPattern('api:patients:detail:*'),
        invalidateCacheByPattern('api:patients:report:*'),
        invalidateCacheByPattern('api:dashboard:stats:*'),
        invalidateCacheByPattern('vr:session-results:list:*'),
        invalidateCacheByPattern('vr:session-results:detail:*'),
        invalidateCacheByPattern('vr:patients-lookup:*')
    ]);
}

module.exports = { invalidatePatientCaches };
