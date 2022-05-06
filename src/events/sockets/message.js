const Message = require("../../schemas/Message");
const User = require("../../schemas/User");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

async function message (socket, io) {
    try {
        const messages = await Message.find({ $or:[{ receivers: socket.user }, { user: socket.user }] });

        const data = await Promise.all(messages.map(async message => {
           const user = await User.findById(message.user);
           return toJSON(message, { author: user.email  })
        }))

        socket.emit('previousMessages', data)
    } catch(err) {
        console.log(err);
    }
    
    socket.on('sendMessage', async data => {
        console.log('oi');
        try {
            const user = await User.findById(socket.user);
            
            const message = await Message.create({ user: socket.user, content: data?.content, receivers: [data?.receiver] })
            
            console.log(message, socket.id)
    
            // socket.broadcast.emit('receivedMessage', data)
    
            io.sockets.in(`user ${data.receiver}`).emit('receivedMessage', toJSON(message, { author: user.email }) );
    
            // socket.to(data.to).emit('receivedMessage', message)
        } catch (err) {
            console.log(err);
        }

    })
}

module.exports = message