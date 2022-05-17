const path = require('path')
const { authVerify } = require('../middlewares/auth')

const folder = "../events";

const events = {
    authMiddleware: async (socket, next) => {
        try {
            await authVerify(socket.handshake.headers['authorization'], 
                async user => {
                    socket.user = user;
                    next()
                }
            )
        } catch (err) { 
            console.log('socket.io exception', { message: err?.message });
            socket.emit('exception', { message: err?.message });
            next(err)
         }
    },
    initialize: (socket, io) => {
        console.log(`socket conected: ${socket.id} | mongoId: ${socket?.user}`)

        socket.join(`logins ${socket.user}`)

        require("fs").readdirSync(path.join(__dirname, folder)).forEach(async file => {
            const event = require(path.join(__dirname, folder, file));
            try {
                await event(socket, io)
            } catch (err) {
                console.log('socket.io exception', { message: err?.message });
                socket.emit('exception', { message: err?.message });
            }
        });
    }
}

module.exports = events