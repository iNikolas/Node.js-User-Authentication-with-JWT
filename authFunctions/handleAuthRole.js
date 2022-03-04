const { ServerError } = require("../controllers/errorController");

const handleAuthRole = (rolesList) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.rights;

      if (!rolesList.includes(userRole))
        throw new ServerError(
          "You do not have access rights to the content!",
          401,
          "Forbidden"
        );

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = handleAuthRole;
