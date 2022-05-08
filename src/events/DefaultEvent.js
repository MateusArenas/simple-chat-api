

async function DefaultEvent (socket, io) {
    socket.on("disconnect", (reason) => {
        
        socket.leave(`user ${socket.user}`)

        console.log('disconnect and leave room', socket.id, reason);
    });
}

module.exports = DefaultEvent