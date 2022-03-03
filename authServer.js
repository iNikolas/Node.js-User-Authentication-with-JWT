require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const errorController = require('./controllers/errorController')
const authServerController = require('./controllers/usersController')

const handleAuthenticateToken = require('./authFunctions/handleAuthenticateToken')
const handleAuthRole = require('./authFunctions/handleAuthRole')
const {authGetContent, checkRequestValidity} = require("./permissions/user");

app.use(bodyParser.json({type: 'application/vnd.api+json'}))

app.use(errorController.mediaTypeError)

app.get('/users', handleAuthenticateToken, handleAuthRole(['admin']), authServerController.getAllUsers)
app.get('/users/:id', handleAuthenticateToken, authServerController.getUser, authGetContent)

app.post('/token', authServerController.refreshAccessToken)
app.post('/users', authServerController.createNewUser)
app.post('/users/login', authServerController.loginUser)

app.patch('/users/:id', handleAuthenticateToken, checkRequestValidity, authServerController.updateUser)

app.delete('/logout', authServerController.logoutUser)
app.delete('/users/:id', handleAuthenticateToken, handleAuthRole(['admin']), authServerController.deleteUser)

app.use(errorController.internalServerError)
app.use(errorController.pageNotFoundError)

app.listen(4000)