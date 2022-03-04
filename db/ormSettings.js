const Pool = require("pg").Pool;

const pool = new Pool({
  user: "postgres",
  password: "666666",
  host: "localhost",
  port: 5432,
  database: "todousers",
});

module.exports = pool;
