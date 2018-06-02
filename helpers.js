exports.addTokenProps = function(token) {
  token.isActive = false
  token.isConnecting = false
  token.texture = undefined
  token.sprites = []
  return token
}