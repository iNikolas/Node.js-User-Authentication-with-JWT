const { ServerError } = require("../controllers/errorController");
const canViewContent = (user, content) => {
  return user.rights === "admin" || user.uid === content.data.id;
};

const isValidId = (paramId, bodyId, user) => {
  return (
    (user.rights === "admin" && paramId === bodyId) ||
    (paramId === bodyId && paramId === user.uid)
  );
};

const authGetContent = async (req, res, next) => {
  try {
    const content = req.content;
    const user = req.user;

    if (!canViewContent(user, content))
      throw new ServerError(
        "You do not have access rights to the content!",
        403,
        "Forbidden"
      );

    res.set("Content-Type", "application/vnd.api+json");
    res.status(200);
    res.json(content);
  } catch (error) {
    next(error);
  }
};

const checkRequestValidity = async (req, res, next) => {
  try {
    const user = req.user;
    const body = req.body;

    const paramId = req.params.id;
    const bodyId = body.data.id;

    if (!isValidId(paramId, bodyId, user))
      throw new ServerError(
        "Provided parameter ID and body ID do not match or you do not have rights for this action.",
        409,
        "Conflict"
      );

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authGetContent, checkRequestValidity };
