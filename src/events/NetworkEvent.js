const User = require("../schemas/User");

async function NetworkEvent (socket, io) {
    // diz para todos os listerners do usuario que está online
    io.sockets.in(`listeners ${socket.user}`).emit('networkStatus', { online: true });

    socket.on(`seeOnline`, async user => {
        if (!await User.findById(user)) { throw new Error('this user for see network status not exists.') }

        //quando quer ver se o usuario está online entrasse em uma sala de espera
        socket.join(`listeners ${user}`)

        const data = { online: true };
        // verifica se n tem alguma tela de usuario passado pelo id conectada
        if (!io.sockets.adapter.rooms.get(`logins ${user}`)?.size) { //is offline
            data.online = false;
            //aqui pega a ultima coneção passada quando disconectado
            data.lastSeenAt = io.sockets.adapter.rooms.get(`listeners ${user}`)?.lastSeenAt;
        } 

        io.sockets.in(`logins ${socket.user}`).emit('networkStatus', data);
    });

    socket.on("disconnecting", () => {
        // verifica se há mais de uma conexão do usuario antes de dizer que ele está offline
        if (io.sockets.adapter.rooms.get(`logins ${socket.user}`)?.size <= 1) { 
            //aqui é a ultima conecção
            const lastSeenAt = Date.now()
             //verifica se há listeners
            if (io.sockets.adapter.rooms.get(`listeners ${socket.user}`)?.size) {
                //diz qual foi a data de aparição do usuario
                io.sockets.adapter.rooms.get(`listeners ${socket.user}`).lastSeenAt = lastSeenAt;
            }
    
            //manda a ultima conecção para todos os listeners
            io.sockets.in(`listeners ${socket.user}`).emit('networkStatus', { online: false, lastSeenAt });
        }
    });
}

module.exports = NetworkEvent