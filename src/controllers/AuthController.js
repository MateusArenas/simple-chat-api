const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../schemas/User')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')

function generateToken (params = {}) {
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 86400
    })
}

module.exports = {
    async register (req, res) {
        const { email, password } = req.body
        try {
            if (await User.findOne({ email })) {
                return res.status(400).json({ error: 'User already exists' })
            }
        
            const user = await User.create(req.body)
            
            user.password = password
        
            return res.json({ 
                user,
                token: generateToken({ id: user._id })
            })
        } catch (err) {
            return res.status(400).json({ error: JSON.stringify(err) })
        }
    },

    async authenticate (req, res) {
        const { email, password } = req.body
        try {
          console.log('innnnnnnnnnnnnnnnnnnnnnnnnnnnn');

          const user = await User.findOne({ email }).select('+password')

          console.log(user);
    
          if (!user) 
            return res.status(400).json({ error: 'User not found' })
    
          if(!await bcrypt.compare(password, user.password))
            return res.status(400).json({ error: 'Invalid password' })
    
          user.password = password
    
          return res.json({ 
            user, 
            token: generateToken({ id: user._id })
          })
        } catch (err) {
          return res.status(400).json({ error: 'Authentica failed ' + err?.message })
        }
      }
}