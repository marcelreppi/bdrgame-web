import React from 'react'
import * as PIXI from 'pixi.js';

import '../css/Canvas.css';

import { throttle } from '../helpers'

class Canvas extends React.Component {

  constructor(props) {
    super(props)

    this.textures = {}
    this.tokenSpriteContainer = new PIXI.Container()
    this.connectionContainer = new PIXI.Container()
    this.gridGraphicContainer = new PIXI.Container()
    this.playerContainer = new PIXI.Container()
    this.playerTempSprite = new PIXI.Sprite()
    this.stageInitialized = false

    this.dragging = false
    this.dragX = undefined
    this.dragY = undefined

    // Config Variables
    this.SHOW_GRID = true
    this.PLAYER_VISION = 0.2

    this.IMG_RESOURCES = [
      { name: 'standardHex', url: './images/hex-standard.png' },
      { name: 'selectedHex', url: './images/hex-selected.png' },
      { name: 'hoverHex', url: './images/hex-hover.png' },
      { name: 'connectingHex', url: './images/hex-connecting.png' },
      { name: 'activePlayer', url: './images/player-active.png' }, // Hex Color: 0xFFFF00
      { name: 'activePlayerTemp', url: './images/player-active-temp.png' },
      { name: 'otherPlayer', url: './images/player-other.png' } // Hex Color: 0x29BFFF
    ]
    // Prepare loader
    this.loader = PIXI.loader
    // Callback is executed after each img has loaded
    // Save textures in order to access them later
    this.loader.onLoad.add( (loader,resource) => this.textures[resource.name] = resource.texture )
    this.loader.add(this.IMG_RESOURCES)
  }

  componentDidMount() {
    // In case of height being automatically rounded up I subtract 1 to be safe
    this.width = this.canvas.offsetWidth - 1
    this.height = this.canvas.offsetHeight - 1
    
    // Do basic Pixi.js setup after component is mounted
    const rendererConfig = {
      // In case of height being automatically rounded up I subtract 1 to be safe
      width: this.width,
      height: this.height,
      antialias: true,
      autoResize: true,
      view: this.canvas
    }

    // Create renderer
    this.renderer = PIXI.autoDetectRenderer(rendererConfig)
    //Create a container object called the `stage`
    // initialize stage, make it interactive
    this.stage = new PIXI.Container()

    if(this.SHOW_GRID){
      this.addGrid()
    }

    this.stage.addChild(this.connectionContainer)
    this.stage.addChild(this.tokenSpriteContainer)
    this.stage.addChild(this.playerContainer)
    this.stage.interactive = true
    this.stage.on('click', (e) => {
      if (this.props.movePlayer) { // || e.data.originalEvent.which === 2) {
        this.onMovePlayer(e)
      } 
    })

    this.loader.load((loader, resources) => {
      console.log('All resources loaded')
      // Set up temporary player sprite
      this.playerTempSprite.texture = this.textures.activePlayerTemp
      this.playerTempSprite.anchor.x = 0.5
      this.playerTempSprite.anchor.y = 0.5
      this.playerTempSprite.alpha = 0.8

      this.addConnectionsToStage(this.props.connections)

        this.addAllEventListeners()
        for (let i = 0, len = this.props.allPlayers.length; i < len; i++) {
          const player = this.props.allPlayers[i]
          if (player.isSelected) {
            this.addPlayerToStage(player)
          }   
        }
        this.updateStage()
        this.renderStage()
        this.stageInitialized = true
      })
  }

  componentDidUpdate(prevProps) {
    if (this.stageInitialized) {
      console.log('Canvas component updated')
      const newConnections = this.props.connections.slice(prevProps.connections.length)
      this.addConnectionsToStage(newConnections)

      this.playerTempSprite.visible = this.props.tempVisible
      this.updateStage('other')
      this.renderStage()
    }
  }

  render() {
    return (
      <div className="Canvas">
        <canvas ref={(input) => this.canvas = input}></canvas>
      </div>
    )
  }

  addPlayerToStage(player) {
    const texture = player.id === this.props.chosenPlayerId ? this.textures.activePlayer : this.textures.otherPlayer
    const playerSprite = new PIXI.Sprite(texture)
    playerSprite.anchor.x = 0.5
    playerSprite.anchor.y = 0.5
    playerSprite.x = player.x * this.width
    playerSprite.y = player.y * this.height
    playerSprite.alpha = 0.8

    if(this.stage.scale.x >= 1){
      playerSprite.scale.x = 1 / this.stage.scale.x
      playerSprite.scale.y = 1 / this.stage.scale.y
    }

    playerSprite.player = player
    player.sprite = playerSprite
    this.playerContainer.addChild(playerSprite)

    // Add player vision
    const playerVisionGraphic = new PIXI.Graphics()
    const fillColor = player.id === this.props.chosenPlayerId ? 0xFFFF00 : 0x29BFFF
    playerVisionGraphic.beginFill(fillColor)
    playerVisionGraphic.drawEllipse(0, 0, this.PLAYER_VISION * this.width, this.PLAYER_VISION * this.height)
    playerVisionGraphic.x = playerSprite.x
    playerVisionGraphic.y = playerSprite.y
    playerVisionGraphic.alpha = 0.3
    playerVisionGraphic.player = player
    player.visionGraphic = playerVisionGraphic
    this.playerContainer.addChild(playerVisionGraphic)
  }

  addGrid() {
    this.stage.addChild(this.gridGraphicContainer)
    for(let i = -5; i < 5; i++){
      for(let j = -5; j < 5; j++){
        const rect = new PIXI.Graphics()
        rect.lineStyle(5, 0x00FF00)
        rect.beginFill(0,0)
        rect.drawRect(i*this.width, j*this.height, this.width, this.height)
        rect.endFill()
        this.gridGraphicContainer.addChild(rect)
      }
    }
  }

  addTokenSprite(token, offsetX = 0, offsetY = 0) {
    // Depending on if the token is connected or not it gets a different texture
    // token.texture = token.isConnected ? textures.greenHex : textures.redHex

    if (token.isActive) {
      token.texture = this.textures.selectedHex
    } else if (token.isConnecting) {
      token.texture = this.textures.connectingHex
    } else {
      token.texture = this.textures.standardHex
    }
    const sprite = new PIXI.Sprite(token.texture)
    // Set anchor to be in the center
    sprite.anchor.x = 0.5
    sprite.anchor.y = 0.5
    
    if(this.stage.scale.x >= 1){
      sprite.scale.x = 1 / this.stage.scale.x
      sprite.scale.y = 1 / this.stage.scale.y
    }
    
    // Sprites are created at origin 0,0 -> translate sprite
    // If no offset is passed in the offset is 0
    sprite.x = (token.x + offsetX) * this.width 
    sprite.y = (token.y + offsetY) * this.height

    // Store offset in sprite
    sprite.offsetX = offsetX
    sprite.offsetY = offsetY

    // Store reference of token in sprite
    sprite.tokenId = token.id

    // Store reference of sprite in token
    token.sprites.push(sprite)
    
    // Make the sprite interactive and react on click
    sprite.interactive = true 
    sprite.on('click', (e) => {
      if (e.data.originalEvent.which === 2) { // prevent middle mouse click
        return
      }
      if (this.props.activeToken) {
        // Set isActive from previous active token to false
        this.props.activeToken.isActive = false
        if (this.props.activeToken.isConnecting) {
          this.props.activeToken.sprites.forEach( s => s.texture = this.textures.connectingHex )
        } else {
          this.props.activeToken.sprites.forEach( s => s.texture = this.textures.standardHex )
        }
        
      }
      
      const token = this.props.tokens.find( t => t.id === sprite.tokenId )
      token.isActive = true
      token.sprites.forEach( s => s.texture = this.textures.selectedHex )
      this.props.setActiveToken(token)
      
      this.renderStage()
    })

    sprite.on('rightclick', (e) => {
      if (this.props.connectingToken) {
        // Set isActive from previous active token to false
        this.props.connectingToken.isConnecting = false
        if (this.props.connectingToken.isActive) {
          this.props.connectingToken.sprites.forEach( s => s.texture = this.textures.selectedHex )
        } else {
          this.props.connectingToken.sprites.forEach( s => s.texture = this.textures.standardHex )
        }
      }
      
      const token = this.props.tokens.find( t => t.id === sprite.tokenId )
      token.isConnecting = true
      token.sprites.forEach( s => s.texture = this.textures.connectingHex )
      this.props.setConnectingToken(token)
      
      this.renderStage()
    })

    sprite.on('mouseover', (e) => {
      const token = this.props.tokens.find( t => t.id === sprite.tokenId )
      if (token.isActive || token.isConnecting) {
        return
      }
      sprite.texture = this.textures.hoverHex
      this.renderStage()  
    })

    sprite.on('mouseout', (e) => {
      const token = this.props.tokens.find( t => t.id === sprite.tokenId )
      if (token.isActive) {
        sprite.texture = this.textures.selectedHex
      } else if (token.isConnecting) {
        sprite.texture = this.textures.connectingHex
      } else {
        sprite.texture = this.textures.standardHex
      }
      this.renderStage()   
    })
    
    // Finally, add the sprite to the stage
    this.tokenSpriteContainer.addChild(sprite) 
  }

  updateStage(source) {
    // Origin of every field is top left corner
    // Y-Axis is inverted...
    // So in the beginning (0,0) is top left corner, (1,1) is bottom right corner

    //  (-1,-1)   (0,-1)   (1,-1)
    //  (-1,0)    (0,0)    (1,0)
    //  (-1,1)    (0,1)    (1,1)

    // Get scaled stage range
    const localScreenTopLeft = this.stage.toLocal(new PIXI.Point(0,0))
    const localScreenBottomRight = this.stage.toLocal(new PIXI.Point(this.width, this.height))

    // New local game borders
    const left = localScreenTopLeft.x
    const right = localScreenBottomRight.x
    const top = localScreenTopLeft.y
    const bottom = localScreenBottomRight.y

    // New normalized game borders
    // Normalized means relative to canvas size
    const nLeft = left/this.width
    const nRight = right/this.width
    const nTop = top/this.height
    const nBottom = bottom/this.height

    // Loop through all visible gamefields
    // Minus and plus 1 to check the fields that are outside of the visible ones
    const startY = Math.floor(nTop) - 1
    const stopY = Math.ceil(nBottom) + 1
    const startX = Math.floor(nLeft) - 1
    const stopX = Math.ceil(nRight) + 1
    for (let y = startY; y < stopY; y++) {
      for (let x = startX; x < stopX; x++) {
        for (let i = 0, len = this.props.tokens.length; i < len; i++) {
          const token = this.props.tokens[i]

          const posX = (x + token.x) * this.width
          const posY = (y + token.y) * this.height

          const scaledSpriteWidth = this.stage.scale.x >= 1 ? (this.textures.standardHex.width / this.stage.scale.x) : this.textures.standardHex.width
          const scaledSpriteHeight = this.stage.scale.y >= 1 ? (this.textures.standardHex.height / this.stage.scale.y) : this.textures.standardHex.height

          // Calculate if token is (not) visible in current gameField(x,y)
          const tokenOutOfBounds = (posX + scaledSpriteWidth/2 < left ||
                                    posX - scaledSpriteWidth/2 > right ||
                                    posY + scaledSpriteHeight/2 < top ||
                                    posY - scaledSpriteHeight/2 > bottom)

          const spriteIndex = token.sprites.findIndex((s) => s.offsetX === x && s.offsetY === y )
          if (tokenOutOfBounds) {
            if (spriteIndex !== -1) {
              // Sprite exists but token is not visible in this gamefield(x,y)
              // Remove it!
              this.tokenSpriteContainer.removeChild(token.sprites[spriteIndex])
              token.sprites.splice(spriteIndex, 1)
              if (token === this.props.activeToken) {
                this.props.setActiveToken(this.props.activeToken)
              }
            }
          } else {
            if (spriteIndex !== -1) {
              // Token is visible and sprite already exists
              this.updateTokenSprite(token.sprites[spriteIndex], source)
            } else {
              // Token is visible in current gamefield(x,y) but there is no sprite yet to show it
              this.addTokenSprite(token, x, y)
              if (token === this.props.activeToken) {
                this.props.setActiveToken(this.props.activeToken)
              }
            }
          }
        }
      }
    }

    for (let i = 0, len = this.props.connections.length; i < len; i++) {
      this.updateConnection(this.props.connections[i], source)
    }

    for (let i = 0, len = this.props.allPlayers.length; i < len; i++) {
      const player = this.props.allPlayers[i]
      if (player.sprite === undefined && player.isSelected) {
        this.addPlayerToStage(player) // new player but he is not on the canvas yet
      } else if (player.sprite !== undefined && player.isSelected) {
        // Update players that are seen on the canvas
        this.updatePlayerSprite(player, source)
        this.updatePlayerVision(player, source)
      } else if (player.sprite !== undefined && !player.isSelected) {
        // player was visible but left the game
        this.playerContainer.removeChild(player.sprite)
        this.playerContainer.removeChild(player.visionGraphic)
        delete player.sprite
      }
    }
    this.updatePlayerTempSprite(source)
  }

  addConnectionsToStage(connections) {
    for (let i = 0; i < connections.length; i++) {
      const connection = connections[i]
      const { x:fromX, y:fromY } = this.props.tokens.find( t => t.id === connection.tokenId )
      const { x:toX, y:toY } = this.props.tokens.find( t => t.id === connection.oppositeTokenId )
      const connectionGraphic = new PIXI.Graphics()
      connection.graphic = connectionGraphic
      connectionGraphic.connection = connection
      let lineWidth = 1
      if (this.stage.scale.x >= 1) {
        lineWidth = 1 / this.stage.scale.x
      }
      const lineColor = connection.playerId === this.props.chosenPlayerId ? 0xFFFF00 : 0x29BFFF
      connectionGraphic
        .lineStyle(lineWidth, lineColor)
        .moveTo(fromX * this.width, fromY * this.height)
        .lineTo(toX * this.width, toY * this.height)
      this.connectionContainer.addChild(connectionGraphic)
    }
    this.renderStage()
  }

  updateConnection(connection, source) {
    const { x:fromX, y:fromY } = this.props.tokens.find( t => t.id === connection.tokenId )
    const { x:toX, y:toY } = this.props.tokens.find( t => t.id === connection.oppositeTokenId )
    const lineColor = connection.playerId === this.props.chosenPlayerId ? 0xFFFF00 : 0x29BFFF
    switch (source) {
      case 'resize':
        connection.graphic
          .clear()
          .lineStyle(1, lineColor)
          .moveTo(fromX * this.width, fromY * this.height)
          .lineTo(toX * this.width, toY * this.height)
        break;
      case 'wheel':
        if (this.stage.scale.x >= 1) {
          connection.graphic
            .clear()
            .lineStyle(1 / this.stage.scale.x, lineColor)
            .moveTo(fromX * this.width, fromY * this.height)
            .lineTo(toX * this.width, toY * this.height)
        }
        break;
      case 'other':
        break;
      default: break
    }
  }

  updatePlayerTempSprite(source) {
    switch (source) {
      case 'resize':
        this.playerTempSprite.x = this.playerTempSprite.newPlayerX * this.width
        this.playerTempSprite.y = this.playerTempSprite.newPlayerY * this.height
        break;
      case 'wheel':
        if(this.stage.scale.x >= 1){
          this.playerTempSprite.scale.x = 1 / this.stage.scale.x
          this.playerTempSprite.scale.y = 1 / this.stage.scale.y
  }
        break;
      case 'other':
        this.playerTempSprite.x = this.playerTempSprite.newPlayerX * this.width
        this.playerTempSprite.y = this.playerTempSprite.newPlayerY * this.height
        break;
      default: break
    }
  }

  updatePlayerSprite(player, source) {
    switch (source) {
      case 'resize':
        player.sprite.x = player.x * this.width
        player.sprite.y = player.y * this.height
        break;
      case 'wheel':
        if(this.stage.scale.x >= 1){
          player.sprite.scale.x = 1 / this.stage.scale.x
          player.sprite.scale.y = 1 / this.stage.scale.y
        }
        break;
      case 'other':
        player.sprite.x = player.x * this.width
        player.sprite.y = player.y * this.height
        break;
      default: break
    }
  }

  updatePlayerVision(player, source) {
    switch (source) {
      case 'resize':
        player.visionGraphic.x = player.x * this.width
        player.visionGraphic.y = player.y * this.height
        player.visionGraphic.width = this.PLAYER_VISION * this.width * 2
        player.visionGraphic.height = this.PLAYER_VISION * this.height * 2
        break;
      case 'other': 
        player.visionGraphic.x = player.x * this.width
        player.visionGraphic.y = player.y * this.height
        break
      default: break
    }
  }

  updateTokenSprite(sprite, source) {
    const token = this.props.tokens.find( t => t.id === sprite.tokenId )
    switch (source) {
      case 'resize':
        sprite.x = (sprite.offsetX + token.x) * this.width
        sprite.y = (sprite.offsetY + token.y) * this.height
        break;

      case 'wheel':
        if(this.stage.scale.x >= 1){
          sprite.scale.x = 1 / this.stage.scale.x
          sprite.scale.y = 1 / this.stage.scale.y
        }
        break;
      default: break
    }
  }

  onMovePlayer(event) {
    const localEventPoint = this.stage.toLocal(event.data.global)
    const newPlayerX = localEventPoint.x / this.width
    const newPlayerY = localEventPoint.y / this.height
    this.props.movePlayerPosition(newPlayerX, newPlayerY)

    
    this.playerTempSprite.x = localEventPoint.x
    this.playerTempSprite.y = localEventPoint.y
    
    this.playerTempSprite.newPlayerX = newPlayerX
    this.playerTempSprite.newPlayerY = newPlayerY
    
    this.stage.addChild(this.playerTempSprite)
    this.renderStage()
  }
  
  onMouseDown(event) {
    event.preventDefault()

    this.dragging = true
    this.dragX = event.x
    this.dragY = event.y
    this.renderStage()
  }

  onMouseUp(event) {
    event.preventDefault()
    this.dragging = false
  }

  onMouseMove(event) {
    event.preventDefault()

    if(this.dragging){
      this.stage.x += event.x - this.dragX
      this.stage.y += event.y - this.dragY
      this.dragX = event.x
      this.dragY = event.y

      this.updateStage(event.type)
      this.renderStage()
    }
  }

  onMouseWheel(event) {
    event.preventDefault()

    const zoomIn = event.deltaY < 0
    let zoomFactor = 1.1
    if (!zoomIn) {
      zoomFactor = 1/zoomFactor
    }

    // Dont exactly understand pivot, found solution at
    // http://eiridescent.com/2015/07/zoom-at-the-mouse-in-pixi/
    const w = document.querySelector('.Control').getBoundingClientRect().width

    const eventPoint = new PIXI.Point(event.x - w, event.y)
    const localEventPoint = this.stage.toLocal(eventPoint)

    // Round values to prevent weird zoom bug
    localEventPoint.x = Math.round(localEventPoint.x)
    localEventPoint.y = Math.round(localEventPoint.y)

    const scaleBottomLimit = 0.7
    const scaleTopLimit = 7
    const nextScaleValue = this.stage.scale.x * zoomFactor
    if (nextScaleValue > scaleBottomLimit && nextScaleValue < scaleTopLimit) {
      this.stage.pivot = localEventPoint
      this.stage.position = eventPoint
      this.stage.scale.x *= zoomFactor
      this.stage.scale.y *= zoomFactor
      this.updateStage(event.type)
      this.renderStage()
    } 
  }

  onWindowResize(event) {
    event.preventDefault()
    const { width: newWidth, height: newHeight} = document.querySelector('.Canvas').getBoundingClientRect()

    this.width = newWidth
    this.height = newHeight

    this.renderer.resize(this.width, this.height)

    if(this.SHOW_GRID){
      this.gridGraphicContainer.children.forEach((child) => {
          child.width = this.width
          child.height = this.height
      })      
    }

    this.updateStage(event.type)
    this.renderStage()
  }

  addAllEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this))
    this.canvas.addEventListener('wheel', throttle(this.onMouseWheel.bind(this), 10))
    this.canvas.addEventListener('mousemove', throttle(this.onMouseMove.bind(this), 5))
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this))
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this))
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
  }

  renderStage() {
    this.renderer.render(this.stage)
  }
}

export default Canvas