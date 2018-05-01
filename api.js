const express = require('express')
const router = express.Router()

router.post('/tokens', updateToken)

function updateToken(req, res) {
  // TODO:
  res.end('update token')
}

module.exports = router