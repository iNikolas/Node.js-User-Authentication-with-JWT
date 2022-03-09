require("dotenv").config();

const express = require("express"),
  app = express(),
  cors = require("cors"),
  bodyParser = require("body-parser"),
  cookieParser = require("cookie-parser"),
  errorController = require("./controllers/errorController"),
  authServerController = require("./controllers/usersController"),
  router = express.Router();

const handleAuthenticateToken = require("./authFunctions/handleAuthenticateToken"),
  handleAuthRole = require("./authFunctions/handleAuthRole"),
  todoController = require("./controllers/todosController"),
  { authGetContent, checkRequestValidity } = require("./permissions/user"),
  redis = require("./redis/main"),
  isProduction = process.env.NODE_ENV === "production";

app.set("port", process.env.PORT || 4000);
app.use("/", router);

router
  .use(
    cors({
      origin: isProduction
        ? "https://inikolas.github.io"
        : "http://localhost:3000",
      credentials: true,
    })
  )
  .use(cookieParser())
  .use(bodyParser.json({ type: "application/vnd.api+json" }))
  .use(errorController.mediaTypeError);

router
  .get(
    "/todos",
    handleAuthenticateToken,
    redis.checkRedisCache,
    todoController.getTodos,
    redis.setRedisCache
  )
  .post(
    "/todos",
    handleAuthenticateToken,
    redis.flushRedisCache,
    todoController.createTodo
  );

router
  .get("/todos/:id", handleAuthenticateToken, todoController.getTodo)
  .put(
    "/todos/:id",
    handleAuthenticateToken,
    redis.flushRedisCache,
    todoController.updateTodo
  )
  .delete(
    "/todos/:id",
    handleAuthenticateToken,
    redis.flushRedisCache,
    todoController.deleteTodo
  );

router
  .get(
    "/users",
    handleAuthenticateToken,
    handleAuthRole(["admin"]),
    authServerController.getAllUsers
  )
  .post("/users", authServerController.createNewUser);

router.post("/users/login", authServerController.loginUser);
router.post("/users/token", authServerController.refreshAccessToken);

router.delete("/users/logout", authServerController.logoutUser);

router
  .get(
    "/users/:id",
    handleAuthenticateToken,
    authServerController.getUser,
    authGetContent
  )
  .patch(
    "/users/:id",
    handleAuthenticateToken,
    checkRequestValidity,
    authServerController.updateUser
  )
  .delete(
    "/users/:id",
    handleAuthenticateToken,
    handleAuthRole(["admin"]),
    authServerController.deleteUser
  );

router.use(errorController.internalServerError);
router.use(errorController.pageNotFoundError);

app.listen(app.get("port"), () =>
  console.log(
    `Server has been started and listening at the port number: ${app.get(
      "port"
    )}`
  )
);
