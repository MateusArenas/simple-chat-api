
async function DefaultEvent (socket, io) {

    socket.on("disconnect", (reason) => {
        socket.leave(`logins ${socket.user}`)

        socket.leaveAll();

        console.log('disconnect and leave room', socket.id, reason);
    });
}

module.exports = DefaultEvent