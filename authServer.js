require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const errorController = require('./controllers/errorController')
const authServerController = require('./controllers/authServerController')

const handleAuthenticateToken = require('./handleAuthenticateToken')

app.use(bodyParser.json({type: 'application/vnd.api+json'}))

app.get('/users', handleAuthenticateToken, authServerController.getAllUsers)

app.post('/token', authServerController.refreshAccessToken)
app.post('/users', authServerController.createNewUser)
app.post('/users/login', authServerController.loginUser)

app.delete('/logout', authServerController.logoutUser)

app.use(errorController.internalServerError)
app.use(errorController.pageNotFoundError)

app.listen(4000)