const Conversation = require("../schemas/Conversation");
const User = require("../schemas/User");
const ConversationService = require("../services/ConversationService");
const MessageService = require("../services/MessageService");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

const conecteds = []


async function MessageEvent (socket, io) {
    const auth = socket.user;

    const email = await User.findById(auth).distinct('email')

    conecteds.push(email)
    console.log({ conecteds });

    const authorization = socket.handshake.headers['authorization'];
    try {
        const messages = await MessageService.index({ match: { $or: [{ user: auth }, { receivers: auth }] } }, authorization)

        const data = await Promise.all(messages.results.map(async message => {
            const user = await User.findById(message.user);
            return toJSON(message, { author: user.email  })
        }))

        socket.emit('previousMessages', data) // previus messages, tem que ser as mensagens que não foram vistas ainda

    } catch(err) { throw new Error('error previousMessages ' + err?.message) }
    
    socket.on('sendMessage', async ({ content, receivers, reply, mentions, direct, group }) => {
        try {
            console.log('in send message');
            const message = await MessageService.create({ user: auth, content, receivers, reply, mentions, direct, group });
            
            console.log({ auth });

            // aqui é criado um array dos associados recorrente a mensagem
            const associates = [auth].concat(receivers?.filter(receiver => receiver !== auth))
            
            // aqui é percorrido os associados
            associates.forEach(async associate => { 
                // aqui pega o id do criador da mensagem ja prevndo se caso esteja populado ou não
                const creator = message.user?._id || message.user;

                // aqui verifica se o criador da mensagem é o associado percorrido
                const self = creator.equals(associate)

                // aqui define a direção da mensagem caso não seje do tipo grupo
                const direction = group ? null : self ? direct : creator;

                //
                const { results: [conversation ]} = await ConversationService.index({ match: { user: associate, direct: direction, group } }, authorization)

                io.sockets.in(`user ${associate}`).emit('receivedMessage', toJSON(message, { author: message.user?.email, conversation, self }) );
            })
    
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