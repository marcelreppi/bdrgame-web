const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser');
const http = require('http')
const io = require('socket.io');

const { addTokenProps } = require('./data')

const app = express()
const server = http.createServer(app);
const socket = io(server)

const BACKEND_URL = 'https://bdrgame-backend.herokuapp.com'

// const { tokens, players } = getData()

socket.on('connection', client => {
  console.log(`player ${client.id} has connected`)
  client.on('initialData', (callback) => {
    console.log('sending initial data')

    const tokenPromise = axios.get(BACKEND_URL + '/tokens')
    const playerPromise = axios.get(BACKEND_URL + '/players')
    Promise.all([tokenPromise, playerPromise])
      .then(([tokenRes, playerRes]) => {
        callback({ tokens: tokenRes.data.map(addTokenProps), players: playerRes.data })
      })
  })

  client.on('movePlayer', (id, x, y, callback) => {
    console.log(`player ${id} wants to move to ${x} ${y}`)
    axios.put(BACKEND_URL + `/players/${id}/move`, { x, y })
      .then( res => console.log(`player ${id} successfully move to ${x} ${y}`) )
      .catch( err => console.error(`player ${id} move to ${x} ${y} failed`) )
    // contact backend and check the move
    callback(true)
  })
})

app.use(bodyParser.json());

app.post('/players/move', (req, res) => {
  console.log('move player')
  socket.emit('playerMove', req.body )
  res.end('moved player')
})

// app.use('/', routes)

const PORT = process.env.PORT || 8000
server.listen(PORT)
console.log('listening on port ' + PORT)