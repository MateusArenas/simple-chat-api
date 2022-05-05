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


class AuthController {

    async register (req, res) { // this controller as register account
        const { email, password } = req.body
        try {
            if (await User.findOne({ email })) { return res.status(400).json({ error: 'User already exists' }) }
            
            if (!(/\S+@\S+\.\S+/).test(email)) { return res.status(400).json({ error: 'Error email format' }) }
            
            if (password.length < 8) { return res.status(400).json({ error: 'Error password it s smaller than 8' }) }

            transporter.sendMail({ to: email, from: 'MateusArenas97@gmail.com', template: 'auth/welcome' });

            const verifiedToken = crypto.randomBytes(20).toString('hex')

            const user = await User.create({ email, password, verifiedToken })

            user.password = password

            await transporter.sendMail({
                to: email,
                from: 'MateusArenas97@gmail.com',
                template: 'auth/verify',
                context: { url: `http://localhost:80/verify/${verifiedToken}` },
            })
        
            return res.json({ 
                user, 
                token: generateToken({ id: user._id })
            })
        } catch (err) {
            return res.status(400).json({ error: 'Not created user ' + err?.message })
        }
    }

    async verify (req, res) { // this controller as verify account
        const { token } = req.params
        try {
            if (!token) { return res.status(400).send("Not Token provider") }

            const user = await User.findOne({ verifiedToken: token });

            if (!user) { return res.status(400).send("User invalid and link") }
        
            await User.updateOne({ _id: user._id, verified: true, $unset: { verifiedToken: "" } });

            res.send("email verified sucessfully");
          } catch (error) {
            res.status(400).send("An error occured");
          }
    }

    async authenticate (req, res) { // this controller as authenticate account
        const { email, password } = req.body
        try {
          const user = await User.findOne({ email }).select('+password')

          if (!user) { return res.status(400).json({ error: 'User not found' }) }
    
          if(!await bcrypt.compare(password, user.password)) { return res.status(400).json({ error: 'Invalid password' }) }
    
          user.password = password
    
          return res.json({ 
            user, 
            token: generateToken({ id: user._id })
          })
        } catch (err) {
          return res.status(400).json({ error: 'Authentica failed ' + err?.message })
        }
    }

    async forgotpass (req, res) {
        const { email } = req.params
        try {
          const user = await User.findOne({ email })

          if (!user) { return res.status(400).json({ error: 'User not found' }) }
    
          const passwordResetToken = crypto.randomBytes(20).toString('hex')

          const passwordResetExpires = new Date()

          const now = new Date()

          passwordResetExpires.setHours(now.getHours() + 1)
    
          await User.updateOne({ _id: user._id, passwordResetToken, passwordResetExpires })

          await transporter.sendMail({
            to: email,
            from: 'MateusArenas97@gmail.com',
            template: 'auth/forgotpass',
            context: { url: `http://localhost/redefinepass/${passwordResetToken}` }
          })

          return res.json()
        } catch (err) {
          return res.status(400).json({ error: 'Error on forgot password, try again '+err?.message })
        }
    }

    async resetpass (req, res) {
        const { token, password } = req.body
        try {
            const user = await User.findOne({ passwordResetToken: token }).select('+passwordResetExpires')

            if (!user) { return res.status(400).json({ error: 'User not found or Token invalid' }) }

            const now = new Date()

            if(now > user.passwordResetExpires) { return res.status(400).json({ error: 'Token expired, generate a new one' }) }

            user.password = password

            await user.save()

            return res.json()
        } catch (err) {
            return res.status(400).json({ error: 'Cannot reset password, try again' })
        }
    }
}

module.exports = new AuthController()
