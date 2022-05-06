const User = require('../../schemas/User')
const jwt = require('jsonwebtoken')
const authConfig = require('../../config/auth.json')

async function authMiddleware (socket, next) {
  try {
    const authHeader = socket.handshake.headers['authorization'];

    if(!authHeader) { throw new Error('No token provider') }

    const parts = authHeader.split(' ')

    if(parts.length !== 2) { throw new Error('Token error format') }
 
    const [scheme, token] = parts

    if(!/^Bearer$/i.test(scheme)) { throw new Error('Token malformatted') }

    jwt.verify(token, authConfig.secret, async (err, decoded) => {
      if(err) { throw new Error('Token invalid') }

      const user = await User.findById(decoded.id)

      if (!user) { throw new Error('User not found') }

      if (!user.verified) { throw new Error('User is not verified') }

      socket.user = decoded.id 
      return next()
    })
  } catch(err) { throw new Error(err?.message) }
}

module.exports = authMiddleware