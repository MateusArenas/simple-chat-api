const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const User = require('../schemas/User')
const jwt = require('jsonwebtoken')
const authConfig = require('../config/auth.json')
const transporter = require('../modules/mailer')


class AuthService {

    generateToken (params = {}) {
        return jwt.sign(params, authConfig.secret, {
            expiresIn: 86400
        })
    }
    
    async register ({ email, password }) { // this controller as register account
        try {
            if (await User.findOne({ email })) { throw new Error('User already exists') }
            
            if (!(/\S+@\S+\.\S+/).test(email)) { throw new Error('Error email format') }
            
            if (password.length < 8) { throw new Error('Error password it s smaller than 8') }

            transporter.sendMail({ to: email, from: 'simplechatpop@gmail.com', template: 'auth/welcome' });

            const verifiedToken = crypto.randomBytes(20).toString('hex')

            const user = await User.create({ email, password, verifiedToken })

            user.password = password

            transporter.sendMail({
                to: email,
                from: 'simplechatpop@gmail.com',
                template: 'auth/verify',
                context: { url: `http://localhost/verify/${verifiedToken}` },
            })

            return ({ 
                user, 
                token: this.generateToken({ id: user._id }) 
            })
        } catch (err) { throw new Error('Not created user ' + err?.message) }
    }

    async verify ({ token }) { // this controller as verify account
        try {
            if (!token) { throw new Error("Not Token provider") }

            const user = await User.findOne({ verifiedToken: token });

            if (!user) { throw new Error("User invalid or link") }
        
            await User.updateOne({  _id: user._id }, { verified: true, $unset: { verifiedToken: "", expiredAt: "" } });

            return ({ message: "email verified sucessfully" });
          } catch (err) { throw new Error("An error occured " + err?.message) }
    }

    async authenticate ({ email, password }) { // this controller as authenticate account
        try {
          const user = await User.findOne({ email }).select('+password')

          if (!user) { throw new Error('User not found') }
    
          if(!await bcrypt.compare(password, user.password)) { throw new Error('Invalid password') }
    
          user.password = password
    
          return ({ 
            user, 
            token: this.generateToken({ id: user._id })
          })
        } catch (err) { throw new Error('Authentica failed ' + err?.message ) }
    }

    async forgotpass ({ email }) {
        try {
          const user = await User.findOne({ email })

          if (!user) { throw new Error('User not found') }
    
          const passwordResetToken = crypto.randomBytes(20).toString('hex')

          const passwordResetExpires = new Date()

          const now = new Date()

          const expiresHours = 1;

          passwordResetExpires.setHours(now.getHours() + expiresHours)
    
          await User.updateOne({ _id: user._id, passwordResetToken, passwordResetExpires })

          transporter.sendMail({
            to: email,
            from: 'simplechatpop@gmail.com',
            template: 'auth/forgotpass',
            context: { token: passwordResetToken, url: 'http://localhost/resetpass', expiresHours }
          })

          return ({ message: "send link in email andress for forgotpass" })
        } catch (err) { throw new Error('Error on forgot password, try again ' + err?.message) }
    }

    async resetpass ({ token, password }) {
        try {
            if (password.length < 8) { throw new Error('Error password it s smaller than 8') }

            const user = await User.findOne({ passwordResetToken: token }).select('+passwordResetExpires')

            if (!user) { throw new Error('User not found or Token invalid') }

            const now = new Date()
            
            if(now > user.passwordResetExpires) { throw new Error('Token expired, generate a new one') }

            user.password = password

            await user.save()

            return ({ message: 'password as reset, using you new password' })
        } catch (err) { throw new Error('Cannot reset password, try again ' + err?.message) }
    }
}

module.exports = new AuthService()
