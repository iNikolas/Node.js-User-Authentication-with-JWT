const Redis = require("redis"),
  respondTemplates = require("../controllers/helpers/respondTemplates");

const isProduction = process.env.NODE_ENV === "production",
  client = Redis.createClient(
    isProduction ? { url: process.env.REDIS_URL } : {}
  );

console.log(isProduction);

(async () => {
  client.on("connect", () => console.log("::> Redis Client Connected"));
  client.on("error", (err) => console.log("<:: Redis Client Error", err));

  await client.connect();
})();

const checkRedisCache = async (req, res, next) => {
  try {
    const id = req.user.uid;
    const key = `user:${id}:${req.originalUrl}`;

    const cache = await client.GET(key);

    req.cache = cache;

    next();
  } catch (error) {
    next(error);
  }
};

const setRedisCache = async (req, res, next) => {
  try {
    const id = req.user.uid;
    const key = `user:${id}:${req.originalUrl}`;

    await client.SET(key, JSON.stringify(req.resData));

    respondTemplates.res200(res, req.resData);
  } catch (error) {
    next(error);
  }
};

const flushRedisCache = async (req, res, next) => {
  try {
    const keysList = await client.KEYS(`*${req.user.uid}*`);

    if (keysList.length) await client.DEL(keysList);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { checkRedisCache, setRedisCache, flushRedisCache, client };
