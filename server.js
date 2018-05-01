const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser');
const http = require('http')
const io = require('socket.io');

const routes = require('./api')
const { getData } = require('./data')

const app = express()
const server = http.createServer(app);
const socket = io(server)

const BACKEND_URL = 'http://localhost:8080'

const players = []

socket.on('connection', client => {
  console.log(`player ${client.id} has connected`)

  client.on('initialData', (callback) => {
    callback(getData())
  })

  client.on('movePlayer', (x, y, callback) => {
    console.log(`player ${client.id} wants to move to ${x} ${y}`)
    // contact backend and check the move
    callback(true)
  })
})


app.use(bodyParser.json());
app.use('/', routes)

const PORT = process.env.PORT || 8000
server.listen(PORT)
console.log('listening on port ' + PORT)