const jwt = require("jsonwebtoken"),
  { ServerError } = require("./errorController"),
  { HOST } = require("../common/constants");

const handleGenerateAccessToken = require("../authFunctions/handleGenerateAccessToken"),
  bcrypt = require("bcrypt"),
  pool = require("../db/ormSettings"),
  createTokens = require("./createTokens");

module.exports = {
  refreshAccessToken: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken)
        throw new ServerError(
          "Lacks valid authentication credentials for the requested resource!",
          401,
          "Unauthorized"
        );

      const refreshTokenRequest = await pool.query(
        `SELECT * FROM refreshtokens, users WHERE refreshtokens.token = $1 AND users.uid = refreshtokens.user_uid`,
        [refreshToken]
      );
      const refreshTokenRespond = refreshTokenRequest.rows[0];

      if (!refreshTokenRespond)
        throw new ServerError(
          "Authentication credentials for the requested resource are not valid!",
          403,
          "Forbidden"
        );
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, user) => {
          if (err)
            throw new ServerError(
              "Authentication credentials for the requested resource are not valid!",
              403,
              "Forbidden"
            );

          const name = refreshTokenRespond.name;
          const id = refreshTokenRespond.uid;
          const rights = refreshTokenRespond.rights;

          const userSharedData = {
            name,
            uid: id,
            rights,
          };

          const accessToken = handleGenerateAccessToken(userSharedData);
          const expiresInSec = 300;

          const resData = {
            links: {
              self: `${HOST}/${user.uid}`,
            },
            data: {
              type: "users",
              id,
              attributes: {
                name,
                rights,
              },
              token: accessToken,
            },
            meta: { expiresInSec },
          };

          res.set({
            "Content-Type": "application/vnd.api+json",
            Location: `${HOST}/users/${user.uid}`,
          });
          res.status(201);

          res.json(resData);
        }
      );
    } catch (error) {
      next(error);
    }
  },
  getAllUsers: async (req, res, next) => {
    try {
      const allUsersRequest = await pool.query(
        `SELECT users.uid, name, password, rights, token FROM users LEFT JOIN refreshtokens ON users.uid = refreshtokens.user_uid`
      );
      const allUsersRespond = allUsersRequest.rows;

      const resData = {
        links: {
          self: `${HOST}${req.originalUrl}`,
        },
        data: [],
        meta: { totalUsers: allUsersRespond.length },
      };

      allUsersRespond.forEach((user) => {
        const type = "users";
        const id = user.uid;
        const name = user.name;
        const password = user.password;
        const rights = user.rights;
        const refreshToken = user.token;

        const userData = {
          type,
          id,
          attributes: { name, password, rights },
          meta: { refreshToken },
          links: { self: `${HOST}/${id}` },
        };

        resData.data.push(userData);
      });

      res.set({
        "Content-Type": "application/vnd.api+json",
      });
      res.status(200);
      res.json(resData);
    } catch (error) {
      next(error);
    }
  },
  getUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const userRequest = await pool.query(
        `SELECT * FROM users WHERE users.uid = $1`,
        [id]
      );
      const userRespond = userRequest.rows[0];

      const resData = {
        links: {
          self: `${HOST}${req.originalUrl}`,
        },
        data: null,
      };

      if (userRespond) {
        const type = "users";
        const name = userRespond.name;
        const rights = userRespond.rights;
        const relationships = null;
        const password = userRespond.password;

        const attributes = { name, rights, password };

        resData.data = { type, id, attributes, relationships };
      }

      req.content = resData;
      next();
    } catch (err) {
      next(err);
    }
  },
  updateUser: async (req, res, next) => {
    try {
      const id = req.params.id;
      const { newName, oldPassword, newPassword } = req.body.data.attributes;

      if (!newName && !newPassword)
        throw new ServerError(
          "Lack of data to process. Please provide at least newName or newPassword, not empty fields!",
          400,
          "Bad Request"
        );

      const userRequest = await pool.query(
        `SELECT * FROM users WHERE uid = $1`,
        [id]
      );
      const userRespond = userRequest.rows[0];

      if (!userRespond) next();

      if (await bcrypt.compare(oldPassword, userRespond.password)) {
        const name = newName || userRespond.name;
        const password = newPassword
          ? await bcrypt.hash(newPassword, 10)
          : userRespond.password;

        await pool.query(
          `UPDATE users SET name = $1, password = $2 WHERE uid = $3`,
          [name, password, id]
        );

        res.status(204);
        res.send();
      } else {
        throw new ServerError(
          "You have typed in wrong old password!",
          403,
          "Forbidden"
        );
      }
    } catch (error) {
      next(error);
    }
  },
  createNewUser: async (req, res, next) => {
    const client = await pool.connect();

    try {
      const type = req.body.data.type;
      const user = req.body.data.attributes;
      const name = user.name.trim();
      const password = user.password;

      if (type !== "users")
        throw new ServerError(
          "Lacks valid authentication credentials for the requested resource!",
          401,
          "Unauthorized"
        );
      if (!name || !password)
        throw new ServerError(
          "Username or password can't be empty!",
          401,
          "Unauthorized"
        );

      const hashedPassword = await bcrypt.hash(password, 10);

      await client.query("BEGIN");

      const newUserRequestQuery = `INSERT INTO ${type} (uid, name, password, rights) VALUES(uuid_generate_v4(), $1, $2, 'user') RETURNING *`;
      const newUserRequest = await client.query(newUserRequestQuery, [
        name,
        hashedPassword,
      ]);

      const newUser = newUserRequest.rows[0];

      const id = newUser.uid;
      const rights = newUser.rights;

      await client.query(
        `CREATE TABLE todos_${id.replace(
          /-/g,
          "_"
        )}(todo_uid UUID NOT NULL PRIMARY KEY, created TIMESTAMP NOT NULL, description VARCHAR(255) NOT NULL)`
      );
      await client.query("COMMIT");

      const { accessToken, refreshToken } = await createTokens(newUser);

      const resData = {
        data: {
          type: "users",
          id,
          attributes: {
            name,
            rights,
          },
          links: {
            self: `${HOST}/users/${id}`,
          },
          token: accessToken,
        },
      };

      const maxAgeDays = 7;

      res.cookie("refreshToken", refreshToken, {
        maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      res.set({
        "Content-Type": "application/vnd.api+json",
        Location: `${HOST}/users/${id}`,
      });

      res.status(201);
      res.json(resData);
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    }
  },
  deleteUser: async (req, res, next) => {
    const client = await pool.connect();

    try {
      const { rights } = req.user;

      if (rights !== "admin")
        throw new ServerError(
          "You do not have access rights to the content!",
          403,
          "Forbidden"
        );

      const { id } = req.params;

      await client.query("BEGIN");

      const deleteTokenText = "DELETE FROM refreshtokens WHERE user_uid = $1";
      await client.query(deleteTokenText, [id]);

      const deleteTodosText = `DROP TABLE todos_${id.replace(/-/g, "_")}`;
      await client.query(deleteTodosText);

      const deleteUserText = "DELETE FROM users WHERE uid = $1 RETURNING *";
      const deleteUserRes = await client.query(deleteUserText, [id]);

      await client.query("COMMIT");

      const isDeleted = !!deleteUserRes.rowCount;

      if (isDeleted) {
        res.status(204);
        res.send();
      } else {
        next();
      }
    } catch (err) {
      await client.query("ROLLBACK");
      next(err);
    } finally {
      client.release();
    }
  },
  loginUser: async (req, res, next) => {
    try {
      const type = req.body.data.type;

      if (type !== "users")
        throw new ServerError(
          "Lacks valid authentication credentials for the requested resource!",
          401,
          "Unauthorized"
        );

      const userAttributes = req.body.data.attributes;
      const { name, password } = userAttributes;

      const userRequest = await pool.query(
        `SELECT * FROM users WHERE name = $1`,
        [name]
      );
      const user = userRequest.rows[0];

      if (!user) next();

      const id = user.uid;

      if (await bcrypt.compare(password, user.password)) {
        const { accessToken, refreshToken } = await createTokens(user);

        const resData = {
          data: {
            type: "users",
            id,
            attributes: {
              name: user.name,
              rights: user.rights,
            },
            links: {
              self: `${HOST}/users/${id}`,
            },
            token: accessToken,
          },
        };

        const maxAgeDays = 7;

        res.cookie("refreshToken", refreshToken, {
          maxAge: maxAgeDays * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });

        res.set({
          "Content-Type": "application/vnd.api+json",
          Location: `${HOST}/users/${id}`,
        });
        res.status(201);

        res.json(resData);
      } else {
        throw new ServerError(
          "Lacks valid authentication credentials for the requested resource!",
          401,
          "Unauthorized"
        );
      }
    } catch (error) {
      next(error);
    }
  },
  logoutUser: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      const deleteRefreshTokenRequest = await pool.query(
        `DELETE FROM refreshtokens WHERE token = $1`,
        [refreshToken]
      );

      res.cookie("refreshToken", null, {
        maxAge: 0,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      const isDeleted = !!deleteRefreshTokenRequest.rowCount;

      if (isDeleted) {
        res.status(204);
        res.send();
      } else {
        next();
      }
    } catch (err) {
      next(err);
    }
  },
};
