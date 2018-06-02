import React from 'react'

import '../css/Token.css'

const Token = (props) => {
  return (
    <div className="token-info">
      <div>ID: {props.token.id || ''}</div>
      <div>X: {props.token.x ? props.token.x.toFixed(4) : ''}</div>
      <div>Y: {props.token.y ? props.token.y.toFixed(4) : ''}</div>
      <div>Visible Sprites: {props.token.sprites ? props.token.sprites.length : ''}</div>
      <div className="connector-table">
        Available Connectors:
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Regex</th> 
              <th>Payoff</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            { props.token.connectors ? props.token.connectors.map( c => {
                const style = {
                  backgroundColor: props.highlightConnectorId === c.id ? props.highlightColor : ''
                }
                return (
                <tr key={c.id}>
                  <td style={style}>{c.id}</td>
                  <td style={style}>{c.regex}</td>
                  <td style={style}>{c.payoff.toFixed(4)}</td>
                  <td style={style}>{c.isConnected ? 'Connected' : 'Not Connected'}</td>
                    { !c.isConnected ? 
                      <td className="connect-button-col">
                        <button className="connect-button" onClick={() => props.setConnector(c)}>Choose</button>
                      </td> :
                      null
                    }
                  </tr>
                )
              }) :
              null
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Token