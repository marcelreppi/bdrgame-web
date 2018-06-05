import React, { Component } from 'react';
import io from 'socket.io-client';

import '../css/App.css';

import Canvas from './Canvas'
import ControlPanel from './ControlPanel'
import Login from './Login'

class App extends Component {

  constructor(props) {
    super(props)

    // Connect to webserver socket
    // this.socket = io('http://localhost:8000'); // Use this URL when connecting to local webserver
    this.socket = io('https://bdrgame.herokuapp.com/'); // Use this URL when connecting to public heroku webserver
      
    this.state = {
      chosenPlayerId: null,
      allPlayers: [],  
      tokens: [],
      connections: [],

      activeToken: null,
      connectingToken: null,

      activeConnector: null,
      connectingConnector: null,

      movePlayer: false,
      tempVisible: false,
      
      roundCounter: 0,
      roundTime: 0,
      roundDuration: 0,

      disableActions: false
    }
  }

  componentWillMount() {
    // get initial data before mount
    this.socket.emit('initialData', (data) => {
      console.log('initial data')
      this.setState({
        tokens: data.tokens,
        allPlayers: data.players,
        connections: data.connections,
        roundTime: data.roundTime,
        roundDuration: data.roundDuration
      })
      // start round timer
      this.timerId = setInterval(this.roundTimeInterval, 1000)
    })

    // register update methods for socket
    this.socket.on('movePlayer', (moves) => {
      console.log('player moved')
      const allPlayers = [...this.state.allPlayers]
      for (let i = 0; i < moves.length; i++) {
        const move = moves[i]
        const player = allPlayers.find( p => p.id === move.playerId )
        player.x = move.x
        player.y = move.y
      }
      this.setState({ 
        allPlayers,
        tempVisible: false
      })
    })

    this.socket.on('newTokens', (newTokens) => {
      console.log('new tokens')
      let tokens = [...this.state.tokens]
      tokens = tokens.concat(newTokens)
      this.setState({ tokens })
    })

    this.socket.on('newConnection', (newConnections) => {
      console.log('new connections')
      let connections = [...this.state.connections]
      connections = connections.concat(newConnections)
      this.setState({ connections })
    })

    this.socket.on('updatedTokens', (updatedTokens) => {
      console.log('updated tokens')
      const tokens = [...this.state.tokens]
      for( let i = 0; i < updatedTokens.length; i++ ) {
        let updatedToken = updatedTokens[i]
        const index = tokens.findIndex( t => t.id === updatedToken.id )
        updatedToken = { ...tokens[index], ...updatedToken }
        tokens[index] = updatedToken
        if (this.state.activeToken && this.state.activeToken.id === updatedToken.id) {
          this.setState({
            activeToken: updatedToken
          })
        } else if (this.state.connectingToken && this.state.connectingToken.id === updatedToken.id) {
          this.setState({
            connectingToken: updatedToken
          })
        }
      }
      this.setState({
        tokens
      })
    })

    this.socket.on('newRound', (data) => {
      console.log('new round')
      // increase round counter and reset round timer
      const currentRound = this.state.roundCounter
      this.setState({
        roundCounter: currentRound + 1,
        roundTime: this.state.roundDuration / 1000,
        disableActions: false
      })
      clearInterval(this.timerId)
      this.timerId = setInterval(this.roundTimeInterval, 1000)
    })

    this.socket.on('newPlayer', (player) => {
      const allPlayers = [...this.state.allPlayers]
      allPlayers.push(player)
      this.setState({
        allPlayers
      })
    })

    this.socket.on('updatePlayers', (players) => {
      const allPlayers = this.state.allPlayers
      for (let i = 0; i < players.length; i++) {
        const updatedPlayer = players[i]
        const index = allPlayers.findIndex( p => p.id === updatedPlayer.id)
        allPlayers[index] = { ...allPlayers[index], ...updatedPlayer }
      }
      this.setState({
        allPlayers
      })
    })
    
  }

  roundTimeInterval = () => {
    if (this.state.roundTime > 0) {
      const currentRoundTime = this.state.roundTime
      const newRoundTime = currentRoundTime - 1 
      this.setState({
        roundTime: parseFloat(newRoundTime.toFixed(1))
      })
    }
  }

  setConnector = (which, connector) => {
    switch (which) {
      case '1':
        this.setState({
          activeConnector: connector
        })
        break;
      case '2':
        this.setState({
          connectingConnector: connector
        })
        break;
      default:
        break;
    }
  }

  setChosenPlayer = (player) => {
    this.setState({
      chosenPlayerId: player.id
    })
    this.socket.emit('playerChosen', player.id)
  }

  setActiveToken = (token) => {
    let activeConnector = this.state.activeConnector
    if (this.state.activeToken) {
      activeConnector = this.state.activeToken.id !== token.id ? null : activeConnector
    }
    this.setState({
      activeToken: token,
      activeConnector
    })
  }

  setConnectingToken = (token) => {
    let connectingConnector = this.state.connectingConnector
    if (this.state.connectingToken) {
      connectingConnector = this.state.connectingToken.id !== token.id ? null : connectingConnector
    }
    this.setState({
      connectingToken: token,
      connectingConnector
    })
  }

  setTokens = (tokens) => {
    this.setState({ tokens })
  }

  setPlayers = (players) => {
    this.setState({ allPlayers: players })
  }

  setMovePlayer = (bool) => {
    this.setState({
      movePlayer: bool
    })
  }

  movePlayerPosition = (x, y) => {
    this.socket.emit('movePlayer', this.state.chosenPlayerId, x, y, () => {
      this.setState({ 
        movePlayer: false,
        tempVisible: true,
        disableActions: true,
      })
    })
  }

  makeConnection = () => {
    if (this.state.activeConnector === null || this.state.connectingConnector === null) {
      console.log('some connector is not defined')
      return
    }
    const data = {
      playerId: this.state.chosenPlayerId,
      tokenId: this.state.activeToken.id,
      connectorId: this.state.activeConnector.id,
      oppositeTokenId: this.state.connectingToken.id,
      oppositeConnectorId: this.state.connectingConnector.id
    }
    this.socket.emit('newConnection', data, () => {
      console.log('requested a connection')
      this.setState({
        activeConnector: null,
        connectingConnector: null,
        disableActions: true
      })
    })
  }

  createNewPlayer = () => { 
    console.log('new player')
    this.socket.emit('newPlayer')
  }

  render() {
    return ( 
      this.state.chosenPlayerId === null ? 
        <Login 
          players={this.state.allPlayers}
          setChosenPlayer={this.setChosenPlayer}
          createNewPlayer={this.createNewPlayer}
        /> :
        <div className="App">
          <ControlPanel 
            socket={this.socket}
            activeToken={this.state.activeToken} 
            activeConnector={this.state.activeConnector || {}} 
            connectingToken={this.state.connectingToken}
            connectingConnector={this.state.connectingConnector || {}}  
            setMovePlayer={this.setMovePlayer} 
            makeConnection={this.makeConnection}
            setConnector={this.setConnector}
            roundCounter={this.state.roundCounter}
            roundTime={this.state.roundTime}
            disableActions={this.state.disableActions}
            chosenPlayer={this.state.allPlayers.find( p => p.id === this.state.chosenPlayerId )}
          />
          <Canvas
            tokens={this.state.tokens}
            chosenPlayerId={this.state.chosenPlayerId}
            allPlayers={this.state.allPlayers}
            activeToken={this.state.activeToken}
            setActiveToken={this.setActiveToken}
            connectingToken={this.state.connectingToken}
            setConnectingToken={this.setConnectingToken}
            connections={this.state.connections}
            movePlayer={this.state.movePlayer} 
            movePlayerPosition={this.movePlayerPosition}
            tempVisible={this.state.tempVisible}
            socket={this.socket}
            setTokens={this.setTokens}
            setPlayers={this.setPlayers}
            disableActions={this.state.disableActions}
          />
        </div>
    )
  }
}

export default App;