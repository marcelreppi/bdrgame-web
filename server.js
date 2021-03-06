const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser');
const http = require('http')

const { addTokenProps } = require('./helpers')

const app = express()
const server = http.createServer(app);
const io = require('socket.io')(server)

const BACKEND_URL = 'https://bdrgame-backend.herokuapp.com'
// const BACKEND_URL = 'http://localhost:8080'

app.use('/', express.static('./frontend/build'))

app.use(bodyParser.json());

/////////////////////////////// FRONTEND SOCKET SETUP ///////////////////////////////////

io.on('connection', socket => {
  console.log(`player ${socket.id} has connected`)
  socket.on('initialData', (callback) => {
    console.log('sending initial data')

    const tokenPromise = axios.get(BACKEND_URL + '/tokens')
    const playerPromise = axios.get(BACKEND_URL + '/players')
    const connectionPromise = axios.get(BACKEND_URL + '/connections')
    const timePromise = axios.get(BACKEND_URL + '/time')
    Promise.all([tokenPromise, playerPromise, connectionPromise, timePromise])
      .then(([tokenRes, playerRes, connectionRes, timeRes]) => {      
        callback({ 
          tokens: tokenRes.data.map(addTokenProps),
          players: playerRes.data,
          connections: connectionRes.data, 
          roundTime: timeRes.data.roundTime,
          roundDuration: timeRes.data.roundDuration
        })
      })
  })

  socket.on('movePlayer', (id, x, y, callback) => {
    console.log(`player ${id} wants to move to ${x} ${y}`)
    axios.put(BACKEND_URL + `/players/${id}/move`, { x, y })
      .then( () => {
        console.log(`player ${id} successfully move to ${x} ${y}`)
        callback()
      })
      .catch( err => console.error(`player ${id} move to ${x} ${y} failed`) )
  })

  socket.on('newConnection', (data, callback) => {
    console.log('client requested new connection')
    axios.post(BACKEND_URL + '/tokens/connect', data)
      .then( () => callback() )
      .catch( err => console.error(err) )
  })

  const clientToPlayerMapping = {}
  socket.on('playerChosen', (playerId, callback) => {
    console.log(`player ${playerId} has been chosen`)
    clientToPlayerMapping[socket.id] = playerId
    axios.post(BACKEND_URL + `/players/${playerId}/select`)
      .then( res => io.emit('updatePlayers', [res.data]))
      .catch( err => console.error(err) )
  })

  socket.on('newPlayer', (callback) => {
    axios.post(BACKEND_URL + '/players')
      .then( res => io.emit('newPlayer', res.data))
      .catch( err => console.error(err) )
  })

  socket.on('disconnect', () => {
    console.log(`player ${socket.id} has disconnected`)
    const playerId = clientToPlayerMapping[socket.id]
    if (playerId !== undefined) {
      delete clientToPlayerMapping[socket.id]
      axios.post(BACKEND_URL + `/players/${playerId}/unselect`)
        .then( res => io.emit('updatePlayers', [res.data]))
        .catch( err => console.error(err) )
    }
  })
})

///////////////////////// API ROUTES /////////////////////////////

// Expects: [ { id, x, y, balance, isSelected } ]
// Check backend PlayerDAO for data model
app.put('/players', (req, res) => {
  // console.log('update players')
  io.emit('updatePlayers', req.body)
  res.end()
})

// Expects: [ { playerId, x, y } ]
app.post('/players/move', (req, res) => {
  // console.log('move player')
  io.emit('movePlayer', req.body)
  res.end()
})

// Expects: [ { id, nextConnectorId, x, y, connectors: [...] } ]
// Check backend TokenDAO for data model
app.post('/tokens', (req, res) => {
  // console.log('new token')
  io.emit('newTokens', req.body.map(addTokenProps))
  res.end()
})

// Expects: [ { id, nextConnectorId, x, y, connectors: [...] } ]
// Check backend TokenDAO for data model
app.put('/tokens', (req, res) => {
  // console.log('updated tokens')
  io.emit('updatedTokens', req.body)
  res.end()
})

// Expects: [ { playerId, tokenId, connectorId, oppositeTokenId, oppositeConnectorId } ]
app.post('/tokens/connect', (req, res) => {
  // console.log('new connection')
  io.emit('newConnection', req.body)
  res.end()
})

app.post('/rounds', (req, res) => {
  // console.log('new round')
  io.emit('newRound')
  res.end()
})

const PORT = process.env.PORT || 8000
server.listen(PORT)
console.log('Listening on port ' + PORT)