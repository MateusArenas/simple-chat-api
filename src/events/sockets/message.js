
const messages = [];

function message (socket) {
    socket.emit('previousMessages', messages)

    socket.on('sendMessage', data => {
        console.log(data, socket.id)
        messages.push(data)
        socket.broadcast.emit('receivedMessage', data)
    })
}

module.exports = message