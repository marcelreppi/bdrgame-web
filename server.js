const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser');
const http = require('http')

const { addTokenProps } = require('./data')

const app = express()
const server = http.createServer(app);
const io = require('socket.io')(server)

const BACKEND_URL = 'https://bdrgame-backend.herokuapp.com'
// const BACKEND_URL = 'http://localhost:8080'

app.use(bodyParser.json());

io.on('connection', socket => {
  console.log(`player ${socket.id} has connected`)
  socket.on('initialData', (callback) => {
    console.log('sending initial data')

    const tokenPromise = axios.get(BACKEND_URL + '/tokens')
    const playerPromise = axios.get(BACKEND_URL + '/players')
    Promise.all([tokenPromise, playerPromise])
      .then(([tokenRes, playerRes]) => {
        callback({ tokens: tokenRes.data.map(addTokenProps), players: playerRes.data })
      })
  })

  socket.on('movePlayer', (id, x, y, callback) => {
    console.log(`player ${id} wants to move to ${x} ${y}`)
    axios.put(BACKEND_URL + `/players/${id}/move`, { x, y })
      .then( () => {
        console.log(`player ${id} successfully move to ${x} ${y}`)
        // socket.broadcast.emit('playerMove', { id, x, y })
        callback()
      })
      .catch( err => console.error(`player ${id} move to ${x} ${y} failed`) )
    // contact backend and check the move
  })
})

app.post('/players/move', (req, res) => {
  console.log('move player')
  io.emit('playerMove', req.body )
  res.end()
})

app.post('/tokens', (req, res) => {
  console.log('new token')
  io.emit('newTokens', req.body.map(addTokenProps))
  res.end()
})

// app.use('/', routes)

const PORT = process.env.PORT || 8000
server.listen(PORT)
console.log('listening on port ' + PORT)