const Conversation = require("../schemas/Conversation");
const Message = require("../schemas/Message");
const User = require("../schemas/User");
const ConversationService = require("../services/ConversationService");
const MessageService = require("../services/MessageService");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

async function MessageEvent (socket, io) {
    //aqui é pego o id do usuario via token
    const auth = socket.user;

    // aqui é pego o token Bearer asdam34.j12ej......
    const authorization = socket.handshake.headers['authorization'];
    
    socket.on('sendMessage', async ({ content, receivers, reply, mentions, direct, group, outstanding }) => {
        try {

            // aqui é aonde ocorre a criação da mensagem passando o auth como criador, auth é tirado atraves do midlleware pegando o user id
            // no metodo de criação é criado uma conversa caso não exista, nisso para todos os associados a mensagem
            const message = await MessageService.create({ user: auth, content, receivers, reply, mentions, direct, group, outstanding });
            
            // aqui é percorrido os associados
            await Promise.all([auth].concat(receivers?.filter(receiver => receiver !== auth))?.map(async receiver => { 
                // aqui pega o id do criador da mensagem ja prevndo se caso esteja populado ou não
                const creator = message.user?._id || message.user;

                // aqui verifica se o criador da mensagem é o associado percorrido
                const self = creator.equals(receiver)

                // aqui define a direção da mensagem caso não seje do tipo grupo
                const direction = group ? null : self ? direct : creator;

                //aqui é feito uma busca para pegar a converssa a qual o associado possue, para ser enviado
                const conversation = await ConversationService.search({ match: { user: receiver, direct: direction, group } }, authorization)


                setTimeout(() => {
                    
                    console.log('conversation?.messages?.length: ', conversation?.messages?.length);
                    if (conversation?.messages?.length <= 1) {
                        io.sockets.in(`logins ${receiver}`).emit('receivedConversation', toJSON(conversation, { self }) );
                    }

                    const visualized = !!message?.readers?.find(reader => reader?.equals(receiver))
    
                    io.sockets.in(`logins ${receiver}`).emit('receivedMessage', toJSON(message, { visualized, self }) );
                }, 10000);

            }))
    
        } catch (err) { throw new Error('error previousMessages ' + err?.message) }

    })

    socket.on('seeMessages', async ({ ids }) => {
        try {
            console.log({ ids });
            const reader = await User.findById(auth)

            if (!reader) { throw new Error('reader not exists.')}

            const messages = await Message.find({ _id: { $in: ids }, readers: { $nin: [reader._id] } })
            .populate([{ path: 'receivers', model: 'User' }, { path: 'conversations', model: 'Conversation' }])

            // if (!messages?.length) { throw new Error('Messages not exists.')}
            
            await Promise.all(messages?.map(async message => {
    
                await message.readers.push(reader._id)
    
                await message.save()

                return await Promise.all(message?.receivers?.map(async receiver => { 
                    io.sockets.in(`logins ${receiver._id}`).emit('receivedMessageReader', { reader: toJSON(reader), message: toJSON(message) });
                }))
            }))
    
        } catch (err) { throw new Error('error seeMessages ' + err?.message) }

    })

    socket.on('removeMessage', async ({ id }) => {
        try {
            const message = await MessageService.remove({ user: auth, _id: id });
            
            message?.receivers?.forEach(receiver => {
                io.sockets.in(`logins ${receiver}`).emit('deleteMessage', toJSON(message) );
            });
    
        } catch (err) {
            console.log(err);
        }

    })
}

module.exports = MessageEvent