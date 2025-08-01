// redis.js
require("dotenv").config();
const Redis = require("ioredis");

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redis;
let isRedisConnected = false;
let isReconnecting = false;
let reconnectionTimer = null;
const MAX_RETRIES = 5;

function createRedisConnection() {
  if (isReconnecting) {
    return; // Prevent multiple connection attempts
  }
  
  isReconnecting = true;
  
  try {
    const newRedis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD,
      db: 0,
      lazyConnect: true, // Don't auto-connect
      retryStrategy: (times) => {
        if (times > MAX_RETRIES) {
          return null;
        }
        const delay = Math.min(Math.pow(2, times) * 1000, 10000);
        return delay;
      },
    });

    newRedis.on("connect", () => {
      console.log("✅ Redis connected");
      redis = newRedis;
      isRedisConnected = true;
      isReconnecting = false;
      
      // Clear any pending reconnection timer
      if (reconnectionTimer) {
        clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
      }
    });

    newRedis.on("error", (err) => {
      redis = null;
      isRedisConnected = false;
      isReconnecting = false;
    });

    newRedis.on("close", () => {
      redis = null;
      isRedisConnected = false;
      isReconnecting = false;
      
      // Schedule single reconnection attempt
      if (!reconnectionTimer) {
        reconnectionTimer = setTimeout(() => {
          reconnectionTimer = null;
          if (!isRedisConnected) {
            console.log("🔄 Attempting Redis reconnection...");
            createRedisConnection();
          }
        }, 15000); // 15 seconds
      }
    });

    // Try to connect
    newRedis.connect().catch(() => {
      isReconnecting = false;
    });

    return newRedis;
  } catch (error) {
    console.error("❌ Redis init failed:", error.message);
    redis = null;
    isRedisConnected = false;
    isReconnecting = false;
    return null;
  }
}

// Initial connection
createRedisConnection();

function getRedis() {
  return redis;
}

module.exports = { redis, getRedis, isRedisConnected };
