async function handleCache({ key, ttl = 60, redis, dbQueryFn }) {
  const start = Date.now();

  let cacheAvailable = true;
  let dataFromRedis = null;

  if (!redis) {
    console.warn("⚠️ Redis not available, using DB fallback");
    cacheAvailable = false;
  } else {
    try {
      const cached = await redis.get(key);
      if (cached) {
        dataFromRedis = JSON.parse(cached);
      }
    } catch (err) {
      console.error("⚠️ Redis GET error:", err.message);
      cacheAvailable = false;
    }
  }

  if (dataFromRedis) {
    return {
      source: "redis",
      data: dataFromRedis,
      duration_ms: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  const data = await dbQueryFn();

  if (cacheAvailable) {
    try {
      await redis.set(key, JSON.stringify(data), "EX", ttl);
    } catch (err) {
      console.error("⚠️ Redis SET error:", err.message);
    }
  }

  return {
    source: "db",
    data,
    duration_ms: Date.now() - start,
    timestamp: new Date().toISOString(),
  };
}

module.exports = { handleCache };
