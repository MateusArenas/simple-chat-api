
const message = require('./message')

function initSocketEvents (socket) {
    console.log(`Socket conectado: ${socket.id}`)
    message(socket)
}

module.exports = initSocketEvents