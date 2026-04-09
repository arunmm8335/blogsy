import cacheService, { redis } from '../services/cacheService.js';

const TRACKED_EVENT_TYPES = ['user.registered', 'user.logged_in', 'post.created'];

const toNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getRequestedDate = (rawDate) => {
  const today = new Date().toISOString().slice(0, 10);

  if (!rawDate) return today;
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) return rawDate;

  return null;
};

// @desc    Get Kafka analytics summary from cache counters
// @route   GET /api/analytics/summary?date=YYYY-MM-DD
// @access  Private
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const date = getRequestedDate(req.query.date);

    if (!date) {
      const error = new Error('Invalid date format. Use YYYY-MM-DD.');
      error.status = 400;
      return next(error);
    }

    const totalKey = 'analytics:events:total';
    const dailyTotalKey = `analytics:events:daily:${date}:total`;

    const [totalRaw, dailyTotalRaw] = await Promise.all([
      cacheService.get(totalKey),
      cacheService.get(dailyTotalKey),
    ]);

    const typeResults = await Promise.all(
      TRACKED_EVENT_TYPES.map(async (eventType) => {
        const allTimeKey = `analytics:events:type:${eventType}`;
        const dailyKey = `analytics:events:daily:${date}:type:${eventType}`;

        const [allTimeRaw, dailyRaw] = await Promise.all([
          cacheService.get(allTimeKey),
          cacheService.get(dailyKey),
        ]);

        return {
          eventType,
          allTime: toNumber(allTimeRaw),
          daily: toNumber(dailyRaw),
        };
      })
    );

    const byType = {};
    const byTypeDaily = {};
    typeResults.forEach((item) => {
      byType[item.eventType] = item.allTime;
      byTypeDaily[item.eventType] = item.daily;
    });

    return res.status(200).json({
      summary: {
        total: toNumber(totalRaw),
        byType,
      },
      daily: {
        date,
        total: toNumber(dailyTotalRaw),
        byType: byTypeDaily,
      },
      meta: {
        cacheProvider: redis ? 'upstash' : 'memory-disabled',
        note: redis
          ? 'Counters are persisted in cache with rolling TTL.'
          : 'Redis is not configured. Analytics counters are unavailable through this endpoint.',
      },
    });
  } catch (error) {
    next(error);
  }
};
