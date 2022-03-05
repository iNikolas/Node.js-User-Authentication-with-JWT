const jwt = require("jsonwebtoken");
const {ServerError} = require("./errorController");

const handleGenerateAccessToken = require("../authFunctions/handleGenerateAccessToken");
const bcrypt = require("bcrypt");
const pool = require("../db/ormSettings");
const createTokens = require("./createTokens");

module.exports = {
    refreshAccessToken: async (req, res, next) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken) throw new ServerError("Lacks valid authentication credentials for the requested resource!", 401, "Unauthorized");

            const refreshTokenRequest = await pool.query(
                `SELECT * FROM refreshtokens WHERE TOKEN = $1`,
                [refreshToken]
            );
            const refreshTokenRespond = refreshTokenRequest.rows[0];

            if (!refreshTokenRespond) throw new ServerError("Authentication credentials for the requested resource are not valid!", 403, "Forbidden");
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                    if (err)
                        throw new ServerError("Authentication credentials for the requested resource are not valid!", 403, "Forbidden");

                    const userSharedData = {
                        name: user.name,
                        uid: user.uid,
                        rights: user.rights,
                    };

                    const accessToken = handleGenerateAccessToken(userSharedData);
                    const expiresInSec = 300

                    const resData = {
                        links: {
                            self: `http://localhost:4000/${user.uid}`,
                        },
                        data: {
                            type: "users",
                            id: user.uid,
                            attributes: {
                                name: user.name,
                                rights: user.rights,
                            },
                            token: accessToken
                        },
                        meta: {expiresInSec}
                    };

                    res.set({
                        "Content-Type": "application/vnd.api+json",
                        Location: `http://localhost:4000/users/${user.uid}`,
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
                    self: `http://localhost:4000${req.originalUrl}`,
                },
                data: [],
                meta: {totalUsers: allUsersRespond.length},
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
                    attributes: {name, password, rights},
                    meta: {refreshToken},
                    links: {self: `http://localhost:4000/${id}`},
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
            const {id} = req.params;

            const userRequest = await pool.query(
                `SELECT users.uid, name, password, rights, token FROM users LEFT JOIN refreshtokens ON users.uid = refreshtokens.user_uid WHERE users.uid = $1`,
                [id]
            );
            const userRespond = userRequest.rows[0];

            const resData = {
                links: {
                    self: `http://localhost:5000${req.originalUrl}`,
                },
                data: null,
            };

            if (userRespond) {
                const type = "users";
                const name = userRespond.name;
                const rights = userRespond.rights;
                const relationships = null;
                const password = userRespond.password;
                const refreshToken = userRespond.token;

                const attributes = {name, rights, password};

                resData.data = {type, id, attributes, relationships};
                resData.meta = {refreshToken};
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
            const {newName, oldPassword, newPassword} = req.body.data.attributes;

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
        try {
            const type = req.body.data.type;
            const user = req.body.data.attributes;
            const name = user.name.trim();
            const password = user.password;

            if (type !== "users")
                throw new ServerError("Lacks valid authentication credentials for the requested resource!", 401, "Unauthorized")
            if (!name || !password)
                throw new ServerError("Username or password can't be empty!", 401, "Unauthorized");

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUserRequest = await pool.query(
                `INSERT INTO ${type} (uid, name, password, rights) VALUES(uuid_generate_v4(), $1, $2, 'user') RETURNING *`,
                [name, hashedPassword]
            );
            const newUser = newUserRequest.rows[0];

            const {accessToken, refreshToken} = await createTokens(newUser)

            const id = newUser.uid;
            const rights = newUser.rights;
            const resData = {
                data: {
                    type: "users",
                    id,
                    attributes: {
                        name,
                        rights,
                    },
                    links: {
                        self: `http://localhost:4000/users/${id}`,
                    },
                    token: accessToken
                },
            };

            res.cookie('refreshToken', refreshToken, {maxAge: 604800, httpOnly: true})

            res.set({
                "Content-Type": "application/vnd.api+json",
                Location: `http:/localhost:4000/users/${id}`,
            });

            res.status(201);
            res.json(resData);
        } catch (error) {
            next(error);
        }
    },
    deleteUser: async (req, res, next) => {
        const client = await pool.connect();

        try {
            const {rights} = req.user;

            if (rights !== "admin")
                throw new ServerError(
                    "You do not have access rights to the content!",
                    403,
                    "Forbidden"
                );

            const {id} = req.params;

            await client.query("BEGIN");

            const deleteTokenText = "DELETE FROM refreshtokens WHERE user_uid = $1";
            await client.query(deleteTokenText, [id]);

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
            const {name, password} = userAttributes;

            const userRequest = await pool.query(
                `SELECT * FROM users WHERE name = $1`,
                [name]
            );
            const user = userRequest.rows[0];

            if (!user) next();

            const id = user.uid

            if (await bcrypt.compare(password, user.password)) {

                const {accessToken, refreshToken} = await createTokens(user)

                const resData = {
                    data: {
                        type: "users",
                        id,
                        attributes: {
                            name: user.name,
                            rights: user.rights,
                        },
                        links: {
                            self: `http://localhost:4000/users/${id}`,
                        },
                        token: accessToken
                    },
                };

                res.cookie('refreshToken', refreshToken, {maxAge: 604800, httpOnly: true})

                res.set({
                    "Content-Type": "application/vnd.api+json",
                    Location: `http://localhost:4000/users/${id}`,
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
            const type = req.body.data.type;

            if (type !== "refreshToken")
                throw new ServerError(
                    "Lacks valid authentication credentials for the requested resource!",
                    401,
                    "Unauthorized"
                );

            const refreshToken = req.body.data.attributes.token;

            const deleteRefreshTokenRequest = await pool.query(
                `DELETE FROM refreshtokens WHERE token = $1`,
                [refreshToken]
            );

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