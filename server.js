require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const handleAuthenticateToken = require('./authFunctions/handleAuthenticateToken')

const posts = [
    {name: 'Kyle', title: 'Post 1'},
    {name: 'Jim', title: 'Post 2'},
    {name: 'John', title: 'Post 3'},
    {name: 'John', title: 'Post 4'}
]


app.use(bodyParser.json({type: 'application/vnd.api+json'}))

app.get('/posts', handleAuthenticateToken, (req, res) => {
    const user = req.user
    const userPosts = posts.filter(post => post.name === user.name)
    console.log(userPosts)
    res.json({...userPosts, totalPosts: posts.length})
})

app.listen(3000)