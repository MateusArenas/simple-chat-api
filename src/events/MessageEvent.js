const User = require("../schemas/User");
const MessageService = require("../services/MessageService");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}


async function MessageEvent (socket, io) {
    const auth = socket.user;

    try {
        const messages = await MessageService.index({ match: { $or: [{ user: auth }, { receivers: auth }] } })

        const data = await Promise.all(messages.results.map(async message => {
            const user = await User.findById(message.user);
            return toJSON(message, { author: user.email  })
        }))

        console.log(auth);
        socket.emit('previousMessages', data)

    } catch(err) { throw new Error('error previousMessages ' + err?.message) }
    
    socket.on('sendMessage', async data => {
        try {
            const user = await User.findById(auth);
            
            const message = await MessageService.create({ user: auth, ...data });
            
            message?.receivers?.forEach(receiver => {
                io.sockets.in(`user ${receiver}`).emit('receivedMessage', toJSON(message, { author: user.email }) );
            });
    
        } catch (err) { throw new Error('error previousMessages ' + err?.message) }

    })

    socket.on('removeMessage', async ({ id }) => {
        try {
            const message = await MessageService.remove({ user: auth, _id: id });
            
            message?.receivers?.forEach(receiver => {
                io.sockets.in(`user ${receiver}`).emit('deleteMessage', toJSON(message) );
            });
    
        } catch (err) {
            console.log(err);
        }

    })
}

module.exports = MessageEvent