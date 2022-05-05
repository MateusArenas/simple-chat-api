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
            if (await User.findOne({ email })) { throw new Error('User already exists') }
            
            if (!(/\S+@\S+\.\S+/).test(email)) { throw new Error('Error email format') }
            
            if (password.length < 8) { throw new Error('Error password it s smaller than 8') }

            transporter.sendMail({ to: email, from: 'MateusArenas97@gmail.com', template: 'auth/welcome' });

            const verifiedToken = crypto.randomBytes(20).toString('hex')

            const user = await User.create({ email, password, verifiedToken })

            user.password = password

            transporter.sendMail({
                to: email,
                from: 'MateusArenas97@gmail.com',
                template: 'auth/verify',
                context: { url: `http://localhost/verify/${verifiedToken}` },
            })
        
            return res.json({ 
                user, 
                token: generateToken({ id: user._id })
            })
        } catch (err) { throw new Error('Not created user ' + err?.message) }
    }

    async verify (req, res) { // this controller as verify account
        const { token } = req.params
        try {
            if (!token) { throw new Error("Not Token provider") }

            const user = await User.findOne({ verifiedToken: token });

            if (!user) { throw new Error("User invalid and link") }
        
            await User.updateOne({ _id: user._id, verified: true, $unset: { verifiedToken: "", expiredAt: "" } });

            res.send("email verified sucessfully");
          } catch (err) { throw new Error("An error occured " + err?.message) }
    }

    async authenticate (req, res) { // this controller as authenticate account
        const { email, password } = req.body
        try {
          const user = await User.findOne({ email }).select('+password')

          if (!user) { throw new Error('User not found') }
    
          if(!await bcrypt.compare(password, user.password)) { throw new Error('Invalid password') }
    
          user.password = password
    
          return res.json({ 
            user, 
            token: generateToken({ id: user._id })
          })
        } catch (err) { throw new Error('Authentica failed ' + err?.message ) }
    }

    async forgotpass (req, res) {
        const { email } = req.params
        try {
          const user = await User.findOne({ email })

          if (!user) { throw new Error('User not found') }
    
          const passwordResetToken = crypto.randomBytes(20).toString('hex')

          const passwordResetExpires = new Date()

          const now = new Date()

          const hours = 1;
          passwordResetExpires.setHours(now.getHours() + hours)
    
          await User.updateOne({ _id: user._id, passwordResetToken, passwordResetExpires })

          transporter.sendMail({
            to: email,
            from: 'MateusArenas97@gmail.com',
            template: 'auth/forgotpass',
            context: { token: passwordResetToken, url: 'http://localhost/resetpass', hours }
          })

          return res.json("send link in email andress for forgotpass")
        } catch (err) { throw new Error('Error on forgot password, try again ' + err?.message) }
    }

    async resetpass (req, res) {
        const { token, password } = req.body
        try {
            const user = await User.findOne({ passwordResetToken: token }).select('+passwordResetExpires')

            if (!user) { throw new Error('User not found or Token invalid') }

            const now = new Date()

            if(now > user.passwordResetExpires) { throw new Error('Token expired, generate a new one') }

            user.password = password

            await user.save()

            return res.json('password as reset, using you new password')
        } catch (err) { throw new Error('Cannot reset password, try again ' + err?.message) }
    }
}

module.exports = new AuthController()
