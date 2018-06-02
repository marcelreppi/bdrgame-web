import React from 'react'

import '../css/ControlPanel.css';

import Token from './Token'
import { partial } from '../helpers'

class ControlPanel extends React.Component {

  render() {
    return (
      <div className="Control">
        <h2>Game Controls</h2>

        <p><b>Left Mouse:</b> Choose "Active Token"</p>
        <p><b>Right Mouse:</b> Choose "Connecting Token"</p>
        <p><b>How to move:</b> Click "Move Player" button and click somewhere on the field</p>
        <p><b>How to connect tokens:</b> Select active and connecting token. Select a connector for each token and click the "Connect Tokens" button</p>
        <hr/>
        
        <b>Chosen Player</b>
        <div className="player-info">
          <div>Player ID: {this.props.chosenPlayer.id}</div>
          <div>X: {this.props.chosenPlayer.x.toFixed(4)}</div>
          <div>Y: {this.props.chosenPlayer.y.toFixed(4)}</div>
          <div>Balance: {this.props.chosenPlayer.balance.toFixed(4)}</div>
        </div>

        <div className="action-buttons">
          <p>Choose your action for this round</p>
          <button disabled={this.props.disableActions} className="move-player-button" onClick={() => this.props.setMovePlayer(true)}>Move Player</button>
          <button disabled={this.props.disableActions} className="connect-tokens-button" onClick={() => this.props.makeConnection()}>Connect Tokens</button>
        </div>

        <div>
          Round: { this.props.roundCounter }
        </div>
      
        <div>
          Remaining round duration: <span className="round-time">{ this.props.roundTime }</span> seconds
        </div>
      
        <div className="token-title"><b>Active Token</b></div> 
        <Token 
          token={this.props.activeToken || {}}
          setConnector={partial(this.props.setConnector, '1')}
          highlightConnectorId={this.props.activeConnector.id} 
          highlightColor="rgb(51, 255, 0)"
        />
        <div className="token-title"><b>Connecting Token</b></div> 
        <Token
          token={this.props.connectingToken || {}}
          setConnector={partial(this.props.setConnector, '2')}
          highlightConnectorId={this.props.connectingConnector.id}
          highlightColor="rgb(255, 0, 242)"
        />
      </div>
    )
  }
}

export default ControlPanel