const jwt = require("jsonwebtoken");

const handleGenerateAccessToken = (user) => {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
};

module.exports = handleGenerateAccessToken;
