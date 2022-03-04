#User Authentication and with JWT

##Introduction
**JWT** (_JSON Web Tokens_) is one of the more popular ways to secure applications. By means of JWT server can recognize previously authenticated users, give exact Authorization rights or even grant access to different services seamlessly. JWT represents encrypted JSON data which can be only read with a secure key stored and accessible only on the server-side. JWT can be permanent or temporary and even has refresh and logout mechanisms. All of them are represented in this application.

This is a secure Node.js user authentication system. It is covering all the security concerns that you will run into while building an authentication system. It also provides encrypted password storing in the DB and a secure authentication process. It fully encompasses CRUD operations to operate the server.

##Some Endpoints

###Create new user

**Request**
POST http://localhost:4000/users/
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

`{ "data": { "type": "users", "attributes": {"name": "John", "password": "secret-ultra-password"} } }`

**Response**

`{ "data": { "type": "users", "id": <uid>, "attributes": { "name": "John", "rights": "user" }, "links": { "self": "http://localhost:4000/users/<uid>" } } }`

###Login user

**Request**
POST http://localhost:4000/users/login
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

`{ "data": { "type": "users", "attributes": {"name": "John", "password": "secret-ultra-password"} } }`

**Response**

`{ "data": { "type": "users", "id": <uid>, "attributes": { "name": "John", "rights": "user" }, "links": { "self": "http://localhost:4000/users/<uid>" } }, "meta": { "accessToken": <accessToken>, "refreshToken": <refreshToken> } }`

###Get all users

**Request**
GET http://localhost:4000/users/
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Authorization: Bearer <accessToken>

**Response**

`{ "links": { "self": "http://localhost:4000/users/" }, "data": [ { "type": "users", "id": <uid>, "attributes": { "name": "John", "password": <encrypted password>, "rights": "user" }, "meta": { "refreshToken": <refreshToken> }, "links": { "self": "http://localhost:4000/<uid>" } } ], "meta": { "totalUsers": 1 } }`

###Refresh access token

**Request**
POST http://localhost:4000/token/
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

`{ "data": { "type": "refreshToken", "attributes": {"token": <refresh token>} } }`

**Response**

`{ "links": { "self": "http://localhost:4000/token/" }, "data": { "type": "accessToken", "attributes": { "token": <refresh token> } } }`

###Delete user

**Request**
DELETE http://localhost:4000/users/1184ad9c-bf6a-4b23-be15-31458defe863
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Authorization: Bearer <accessToken>

`{ "data": { "type": "refreshToken", "attributes": {"token": <refreshToken>} } }`

**Response**

Status: 204
No Content

###Update user

**Request**
PATCH http://localhost:4000/users/1184ad9c-bf6a-4b23-be15-31458defe863
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json
Authorization: Bearer <accessToken>

`{ "data": { "type": "users", "id": <uid>>, "attributes": { "newName": "Jhon Rocks", "oldPassword": "old password", "newPassword": "new password" } } }`

**Response**

Status: 204
No Content

###Example falsy response

`{ "jsonapi": { "version": "1.0" }, "errors": [ { "status": 403, "title": "Forbidden", "detail": "Authentication credentials for the requested resource are not valid!", "source": { "pointer": "/token/" } } ] }`
