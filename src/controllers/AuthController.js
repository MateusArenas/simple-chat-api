const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../schemas/User')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')
const transporter = require('../modules/mailer')


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

            const token = generateToken({ id: user._id })

            await transporter.sendMail({
                to: email,
                from: 'MateusArenas97@gmail.com',
                template: 'auth/verify',
                context: { url: `http://localhost:80/verify/${user._id}/${token}` },
            })
        
            return res.json({ user, token })
        } catch (err) {
            return res.status(400).json({ error: JSON.stringify(err) })
        }
    },

    async verify (req, res) {
        try {
            const user = await User.findOne({ _id: req.params.id });
            if (!user) return res.status(400).send("User invalid and link");
        
            jwt.verify(req.params.token, authConfig.secret, (err, decoded) => {
                if(err) { return res.status(400).send("Token invalid and link") }
                
                if (!user?._id?.equals(decoded.id)) { return res.status(400).send("Not is self user!") }
            })
        
            await User.updateOne({ _id: user._id, verified: true });
        
            res.send("email verified sucessfully");
          } catch (error) {
            res.status(400).send("An error occured");
          }
    },

    async authenticate (req, res) {
        const { email, password } = req.body
        try {
          const user = await User.findOne({ email }).select('+password')

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