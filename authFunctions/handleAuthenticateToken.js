const jwt = require("jsonwebtoken");
const { ServerError } = require("../controllers/errorController");

const handleAuthenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
      throw new ServerError(
        "Lacks valid authentication credentials for the requested resource!",
        401,
        "Unauthorized"
      );

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err)
        throw new ServerError(
          "Authentication credentials for the requested resource are not valid!",
          403,
          "Forbidden"
        );
      req.user = user;
      next();
    });
  } catch (error) {
    next(error);
  }
};

module.exports = handleAuthenticateToken;
