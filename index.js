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
  { authGetContent, checkRequestValidity } = require("./permissions/user");

app.set("port", process.env.PORT || 4000);
app.use("/", router);

router
  .use(
    cors({
      origin: /*"http://localhost:3000"*/ "https://inikolas.github.io",
      credentials: true,
    })
  )
  .use(cookieParser())
  .use(bodyParser.json({ type: "application/vnd.api+json" }))
  .use(errorController.mediaTypeError);

router
  .get("/todos", handleAuthenticateToken, todoController.getTodos)
  .post("/todos", handleAuthenticateToken, todoController.createTodo);

router
  .get("/todos/:id", handleAuthenticateToken, todoController.getTodo)
  .put("/todos/:id", handleAuthenticateToken, todoController.updateTodo)
  .delete("/todos/:id", handleAuthenticateToken, todoController.deleteTodo);

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
