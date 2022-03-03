# User Authentication and with JWT

## Introduction
**JWT** (*JSON Web Tokens*) is one of the more popular ways to secure applications. By means of JWT server can recognize previously authenticated users, give exact Authorization rights or even grant access to different services seamlessly. JWT represents encrypted JSON data which can be only read with a secure key stored and accessible only on the server-side. JWT can be permanent or temporary and even has refresh and logout mechanisms. All of them are represented in this application.

This is a secure Node.js user authentication system. It is covering all the security concerns that you will run into while building an authentication system. It also provides encrypted password storing in the DB and a secure authentication process.

## Some Endpoints

### Create new user

**Request**
POST http://localhost:4000/users/
Content-Type: application/vnd.api+json
Accept: application/vnd.api+json

`{
             "data": {
                 "type": "users",
                 "attributes": {"name": "John", "password": "secret-ultra-password"}
             }
}`

**Response**

`{
     "data": {
         "type": "users",
         "id": 3,
         "attributes": {
             "name": "John"
         },
         "links": {
             "self": "http://localhost:4000/users/3"
         }
     }
 }`
 
### Login user
 
 **Request**
 POST http://localhost:4000/users/login
 Content-Type: application/vnd.api+json
 Accept: application/vnd.api+json
 
 `{
              "data": {
                  "type": "users",
                  "attributes": {"name": "John", "password": "secret-ultra-password"}
              }
  }`
 
 **Response**
 
 `{
      "data": {
          "type": "accessAndRefreshTokens",
          "attributes": {
              "name": "John",
              "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsInBhc3N3b3JkIjoiJDJiJDEwJFpkMHdEQm1pVEQvOHhNOW5aWUQwWk93cUJyMGVNNUpTZlRjaGpSbnA0eU5DL1hEODNjTnVDIiwiaWF0IjoxNjQ2MjY3ODA5LCJleHAiOjE2NDYyNjc4Mzl9.G38pXxiAKD8HuuwGrdaeOo6Pn2UBWfUFqwJVBbhCE9A",
              "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsInBhc3N3b3JkIjoiJDJiJDEwJFpkMHdEQm1pVEQvOHhNOW5aWUQwWk93cUJyMGVNNUpTZlRjaGpSbnA0eU5DL1hEODNjTnVDIiwiaWF0IjoxNjQ2MjY3ODA5fQ.s26HpnIglad-CoBYwGt_NSpRaba3cmiwFUYSF7wHZAY"
          },
          "links": {
              "self": "http://localhost:4000/users/login"
          }
      }
  }`
  
 ### Get all users
  
  **Request**
  GET http://localhost:4000/users/
  Content-Type: application/vnd.api+json
  Accept: application/vnd.api+json
  Authorization: Bearer <accessToken>
  
  `{
               "data": {
                   "type": "users",
                   "attributes": {"name": "John", "password": "secret-ultra-password"}
               }
   }`
  
  **Response**
  
  `{
       "links": {
           "self": "http://localhost:4000/users/"
       },
       "data": [
           {
               "type": "users",
               "id": 0,
               "attributes": {
                   "name": "John"
               }
           },
           {
               "type": "users",
               "id": 1,
               "attributes": {
                   "name": "John"
               }
           },
           {
               "type": "users",
               "id": 2,
               "attributes": {
                   "name": "John"
               }
           },
           {
               "type": "users",
               "id": 3,
               "attributes": {
                   "name": "John"
               }
           }
       ],
       "meta": {
           "totalUsers": 4
       }
   }`
   
### Refresh access token
 
 **Request**
 POST http://localhost:4000/token/
 Content-Type: application/vnd.api+json
 Accept: application/vnd.api+json
 
 `{
              "data": {
                  "type": "refreshToken",
                  "attributes": {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsInBhc3N3b3JkIjoiJDJiJDEwJC5MMy9pc1hXdHlMWTVqcjM0amN6QWVyMlREN2EwcDcyMmhXUTFZamlyVmNQczJOMnMybVphIiwiaWF0IjoxNjQ2MjY1MDkwfQ.Z2PjjFObf1unKYctYGJc8JhVcgUamFGvHrKdQwCrzx4"}
              }
  }`
 
 **Response**
 
 `{
      "links": {
          "self": "http://localhost:4000/token/"
      },
      "data": {
          "type": "accessToken",
          "attributes": {
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsInBhc3N3b3JkIjoiJDJiJDEwJC5MMy9pc1hXdHlMWTVqcjM0amN6QWVyMlREN2EwcDcyMmhXUTFZamlyVmNQczJOMnMybVphIiwiaWF0IjoxNjQ2MjY1MjIxLCJleHAiOjE2NDYyNjUyNTF9.7Tn_ZYt5kOH4uyu8Ha5lF_4E6YhyiTQ0hT8LmfbF4Rg"
          }
      }
  }`
  
### Delete user
 
 **Request**
 DELETE http://localhost:4000/logout
 Content-Type: application/vnd.api+json
 Accept: application/vnd.api+json
 
 `{
              "data": {
                  "type": "refreshToken",
                  "attributes": {"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiSm9obiIsInBhc3N3b3JkIjoiJDJiJDEwJFpkMHdEQm1pVEQvOHhNOW5aWUQwWk93cUJyMGVNNUpTZlRjaGpSbnA0eU5DL1hEODNjTnVDIiwiaWF0IjoxNjQ2MjY1NDQxfQ.n2vMU_mIEGJ317FSBLDs8ro7_6Z9IalJXR6hGe33IyU"}
              }
  }`
 
 **Response**
 
Status: 204
No Content

### Example falsy response
 
`{
     "jsonapi": {
         "version": "1.0"
     },
     "errors": [
         {
             "status": 403,
             "title": "Forbidden",
             "detail": "Authentication credentials for the requested resource are not valid!",
             "source": {
                 "pointer": "/token/"
             }
         }
     ]
 }`