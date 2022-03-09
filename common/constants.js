const isProduction = process.env.NODE_ENV === "production";

const HOST = isProduction
  ? "https://pern-todos-app.herokuapp.com"
  : "http://localhost:4000";

module.exports = { HOST };
