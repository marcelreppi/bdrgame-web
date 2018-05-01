function Token(id, x, y, connectors){
  this.id = id
  this.x = x
  this.y = y
  this.isConnected = false
  this.isActive = false
  this.texture = undefined
  this.connectors = connectors || []
  this.sprites = []
}

function Connector(id, regex, payoff) {
  this.id = id
  this.regex = regex
  this.payoff = payoff
  this.payoffState = 0 // 0 -> not disbursed; 1 -> disbursed
  this.state = {
    connected: 0, // 0 -> not connected; 1 -> connected
    oppositeTokenId: undefined,
    oppositeConnectorId: undefined,
    connectingPlayerId: undefined
  }
}

function Player(id, x, y) {
  this.id = id
  this.x = x
  this.y = y
  this.balance = 0
}

exports.getData = function() {
  //parameters for test data
  let t = 100 // number of tokens
  let tokens = []
  for (let i = 0; i < t; i++){
    let c = 6 // number of connectors per token
    let connectors = []
    for (let j = 0; j < c; j++) {
      connectors.push( new Connector(j, 'regex', 3) )
    }
    tokens.push( new Token(i, Math.random(), Math.random(), connectors) )
  }
  return { tokens, player: new Player(0, 0.5, 0.5) }
}