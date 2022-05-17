const Conversation = require("../schemas/Conversation");
const Message = require("../schemas/Message");
const User = require("../schemas/User");
const ConversationService = require("../services/ConversationService");
const GroupService = require("../services/GroupService");
const MessageService = require("../services/MessageService");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

async function GroupEvent (socket, io) {
    //aqui é pego o id do usuario via token
    const auth = socket.user;

    // aqui é pego o token Bearer asdam34.j12ej......
    const authorization = socket.handshake.headers['authorization'];
    
    //user, name, admins, members
    socket.on('sendGroup', async ({ name, members }) => {
        try {
            // aqui é aonde ocorre a criação da mensagem passando o auth como criador, auth é tirado atraves do midlleware pegando o user id
            // no metodo de criação é criado uma conversa caso não exista, nisso para todos os associados a mensagem
            const group = await GroupService.create({ user: auth, name, members });
            
            // aqui é percorrido os associados
            await Promise.all([auth].concat(members)?.map(async member => { 
                // aqui pega o id do criador da mensagem ja prevndo se caso esteja populado ou não
                const creator = group.user?._id || group.user;

                // aqui verifica se o criador da mensagem é o associado percorrido
                const self = creator.equals(member)

                //aqui é feito uma busca para pegar a converssa a qual o associado possue, para ser enviado
                const conversation = await ConversationService.search({ match: { user: member, group: group._id } }, authorization)

                io.sockets.in(`logins ${member}`).emit('receivedConversation', toJSON(conversation, { self }) );
            }))
    
        } catch (err) { throw new Error('error sendGroup ' + err?.message) }

    })
}

module.exports = GroupEvent