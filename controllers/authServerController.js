const jwt = require("jsonwebtoken")
const {ServerError} = require("./errorController")
let {refreshTokens} = require("../db")

const handleGenerateAccessToken = require('../handleGenerateAccessToken')
const bcrypt = require("bcrypt");
const {users} = require("../db");

module.exports = {
    refreshAccessToken: async (req, res, next) => {
        try {
            const type = req.body.data.type

            if (type !== 'refreshToken') throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')

            const refreshToken = req.body.data.attributes.token
            if (!refreshToken) throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')
            if (!refreshTokens.includes(refreshToken)) throw new ServerError('Authentication credentials for the requested resource are not valid!', 403, 'Forbidden')
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if (err) throw new ServerError('Authentication credentials for the requested resource are not valid!', 403, 'Forbidden')

                const accessToken = handleGenerateAccessToken({name: user.name, password: user.password})
                const resData = {
                    links: {
                        self: `http://localhost:4000${req.originalUrl}`
                    },
                    data: {
                        type: "accessToken",
                        attributes: {
                            token: accessToken
                        }
                    }
                }

                res.set('Content-Type', 'application/vnd.api+json')
                res.status(201)

                res.json(resData)
            })
        } catch (error) {
            next(error)
        }
    },
    getAllUsers: async (req, res, next) => {
        try {
            const resData = {
                links: {
                    self: `http://localhost:4000${req.originalUrl}`
                },
                data: [],
                meta: {totalUsers: users.length}
            }

            users.forEach((user, index) => {
                const type = 'users'
                const id = index
                const name = user.name
                const userData = {type, id, attributes: {name}}

                resData.data.push(userData)
            })

            res.set({
                'Content-Type': 'application/vnd.api+json',
            })
            res.status(200)
            res.json(resData)
        } catch (error) {
            next(error)
        }
    },
    createNewUser: async (req, res, next) => {
        try {
            const type = req.body.data.type
            const user = req.body.data.attributes
            const {name, password} = user

            if (type !== 'users') throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')
            if (!name || !password) throw new ServerError('Username or password can\'t be empty!', 401, 'Unauthorized')

            const hashedPassword = await bcrypt.hash(password, 10)

            users.push({name, password: hashedPassword})

            const id = users.length - 1
            const resData = {
                data: {
                    type: 'users',
                    id,
                    attributes: {
                        name
                    },
                    links: {
                        self: `http://localhost:4000/users/${id}`
                    }
                }
            }

            res.set({
                'Content-Type': 'application/vnd.api+json',
                'Location': `http:/localhost:4000/users/${id}`
            })

            res.status(201)
            res.json(resData)
        } catch (error) {
            next(error)
        }
    },
    loginUser: async (req, res, next) => {
        try {
            const type = req.body.data.type

            if (type !== 'users') throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')

            const user = users.find(user => user.name === req.body.data.attributes.name)
            if (!user) next()

            if (await bcrypt.compare(req.body.data.attributes.password, user.password)) {
                const accessToken = handleGenerateAccessToken(user)
                const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)

                refreshTokens.push(refreshToken)

                const resData = {
                    data: {
                        type: "accessAndRefreshTokens",
                        attributes: {
                            name: user.name,
                            accessToken,
                            refreshToken
                        },
                        links: {
                            self: `http://localhost:4000${req.originalUrl}`
                        }
                    }
                }

                res.set({
                    'Content-Type': 'application/vnd.api+json',
                })
                res.status(201)

                res.json(resData)
            } else {
                throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')
            }
        } catch (error) {
            next(error)
        }
    },
    logoutUser: async (req, res, next) => {
        try {
            const type = req.body.data.type

            if (type !== 'refreshToken') throw new ServerError('Lacks valid authentication credentials for the requested resource!', 401, 'Unauthorized')

            const refreshToken = req.body.data.attributes.token

            const prevLength = refreshTokens.length
            refreshTokens = refreshTokens.filter(token => token !== refreshToken)
            const newLength = refreshTokens.length

            if (prevLength !== newLength) {
                res.status(204)
                res.send()
            } else {
                next()
            }
        } catch (err) {
            next(err)
        }
    }
}