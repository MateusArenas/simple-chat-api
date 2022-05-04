const { Router } = require('express')

const AuthController = require('./controllers/AuthController')

const routes = Router()

routes.get('/', (req, res) => {
    return res.json({ api: 'run' })
})

routes.post('/register', AuthController.register)
routes.post('/authenticate', AuthController.authenticate)

module.exports = routes