
const User = require('../../schemas/User');
const message = require('./message')

async function initSocketEvents (socket, io) {
    console.log(`Socket conectado: ${socket.id}`)
    
    socket.join(`user ${socket.user}`)

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {

      const user = await User.findById(socket.user)

      users.push({
        socket: id,
        user: socket.user,
        email: user.email
      });
    }

    console.log({ users  });

    message(socket, io)

    socket.on("disconnect", (reason) => {
        
        socket.leave(`user ${socket.user}`)

        console.log('disconnect and leave room', socket.id, reason);
    });
}

module.exports = initSocketEvents