require("dotenv").config();
const express = require("express");
const { getRedis } = require("./redis");
const { db } = require("./db");
const { handleCache } = require("./helpers/cacheHandler");

const app = express();
const PORT = process.env.PORT || 9955;

app.get("/", async (req, res) => {
  const start = Date.now();
  try {
    const result = await handleCache({
      key: "users_cache",
      ttl: 600,
      redis: getRedis(), // Get fresh Redis connection
      dbQueryFn: async () => {
        const [users] = await db.query("SELECT * FROM users");
        return users;
      },
    });

    res.json(result);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      duration_ms: Date.now() - start,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
