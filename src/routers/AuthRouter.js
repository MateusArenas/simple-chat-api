const AuthService = require('../services/AuthService');

const AuthRouter = {
    Get: {
        ['/verify/:token']: async ({ params: { token } }, res) => {
            const auth = await AuthService.verify({ token })
            return res.json(auth)
        },
    },
    Post: {
        ['/register']: async ({ body: { email, password } }, res) => {
            const auth = await AuthService.register({ email, password })
            return res.json(auth)
        },
        ['/authenticate']: async ({ body: { email, password } }, res) => {
            const auth = await AuthService.authenticate({ email, password })
            return res.json(auth)
        },
        ['/resetpass']: async ({ body: { token, password } }, res) => {
            const auth = await AuthService.resetpass({ token, password })
            return res.json(auth)
        },
    },
    Put: {
        ['/forgotpass/:email']: async ({ params: { email } }, res) => {
            const auth = await AuthService.forgotpass({ email })
            return res.json(auth)
        },
    }
}

module.exports = AuthRouter
