# P95 Baseline Report

Date: 2026-02-26  
Target: `https://cerebro-al-fuego-image-rnzssxu5fa-uc.a.run.app`  
Command:

```bash
TEST_API_BASE_URL=https://cerebro-al-fuego-image-rnzssxu5fa-uc.a.run.app \
TEST_PERF_ITERATIONS=25 \
npm run test:perf --workspace=backend
```

Results:

| Endpoint | avg (ms) | p50 (ms) | p95 (ms) |
|---|---:|---:|---:|
| `/health` | 116.68 | 108.03 | 184.89 |
| `/health/live` | 177.15 | 106.99 | 650.59 |
| `/api/status` | 106.87 | 106.29 | 110.83 |

Notes:
- This baseline is network-inclusive from local machine to Cloud Run.
- Use the same command after optimization changes to compare p95 deltas.
