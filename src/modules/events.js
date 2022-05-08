const path = require('path')
const { authVerify } = require('../middlewares/auth')

const folder = "../events";

const events = {
    authMiddleware: async (socket, next) => await authVerify(socket.handshake.headers['authorization'], 
        async user => {
            socket.user = user;
            next()
        }
    ),
    initialize: (socket, io) => {
        console.log(`socket conected: ${socket.id}`)
        socket.join(`user ${socket.user}`)

        require("fs").readdirSync(path.join(__dirname, folder)).forEach((file) => {
            const event = require(path.join(__dirname, folder, file));
            event(socket, io)
        });
    }
}

module.exports = events