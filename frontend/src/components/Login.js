import React from 'react'

import '../css/Login.css';


class Login extends React.Component {

  render() { 
    return (
      <div className="Login">
        <div className="header">
          <h2>BDR Game</h2>
          <h3>Choose your player or <span><button onClick={this.props.createNewPlayer}>Create a new player</button></span></h3>
        </div>
        <div className="player-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>X</th> 
                <th>Y</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {
                this.props.players.map( p => {
                  if (!p.isSelected) {
                    return (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.x.toFixed(4)}</td>
                        <td>{p.y.toFixed(4)}</td>
                        <td>{p.balance.toFixed(4)}</td>
                        <td className="select-button-col">
                          <button onClick={() => this.props.setChosenPlayer(p)}>Select</button>
                        </td>
                      </tr>
                    )
                  }
                  return null
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    )
  }
}

export default Login