const path = require('path')
const { Router } = require('express')

const AuthController = require('./controllers/AuthController')

const routes = Router()

routes.get('/', (req, res) => {
    return res.json({ api: 'run' })
})

routes.post('/register', AuthController.register)
routes.get('/verify/:token', AuthController.verify)

routes.post('/authenticate', AuthController.authenticate)

routes.put('/forgotpass/:email', AuthController.forgotpass)
routes.post('/resetpass', AuthController.resetpass)

routes.get('/redefinepass/:token', function(req, res) {
    res.sendFile(path.join(__dirname, './resources', './auth', '/redefinepass.html'));
});

module.exports = routes