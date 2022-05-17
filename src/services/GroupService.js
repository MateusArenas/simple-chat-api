const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const Message = require("../schemas/Message");
const Conversation = require("../schemas/Conversation");
const User = require("../schemas/User");
const Group = require("../schemas/Group");
const aggregate = require('../utils/aggregate');
const ConversationService = require("./ConversationService");

const { io } = require("../app");

function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

class GroupService {

    async index ({ match, options }, authorization) { // busca todos
        const auth = await AuthAsync.getAuthUser(authorization)
        try {
            const [groups] = await Group.aggregate([
                { $match: aggregate.match(match) },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                    }
                },
                {   
                    $facet: {
                        results: [],
                        total: [{ $count: 'count' }]
                    }
                },
                { 
                    $project: { 
                        results: '$results', 
                        total: { $arrayElemAt: ['$total.count', 0] } 
                    } 
                },  
            ])

            const results = await Group.populate(groups?.results, [
                { model: 'User', path: 'user' },
                { model: 'User', path: 'admins' },
                { model: 'User', path: 'members' },
                { model: 'Conversation', path: 'conversations' },
                { model: 'Message', path: 'messages' },
            ])

            return ({ ...groups, results  })
        } catch (err) { throw new Error('Error for index groups ' + err?.message) }
    }

    async search ({ match, options }, authorization) {
        const auth = await AuthAsync.getAuthUser(authorization)
        try {

            const [group] = await Group.aggregate([
                { $match: aggregate.match(match) },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                    }
                },
                {   
                    $facet: {
                        results: [],
                        total: [{ $count: 'count' }]
                    }
                },
                { 
                    $project: { 
                        results: '$results', 
                        total: { $arrayElemAt: ['$total.count', 0] } 
                    } 
                },  
                { $unwind: "$results" }, { $unwind: "$total" },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [ "$results", { total: "$total.count" } ]
                        }
                    }
                },
            ])

            return await Group.populate(group, [
                { model: 'User', path: 'user' },
                { model: 'User', path: 'admins' },
                { model: 'User', path: 'members' },
                { model: 'Conversation', path: 'conversations' },
                { model: 'Message', path: 'messages' },
                // { model: 'Reaction', path: 'reactions' },
            ])
        } catch (err) { throw new Error('Error for search group ' + err?.message) }
    }

    async create ({ user, name, admins, members }) {
        console.log('in create');
        try {
            if(!members?.length) { throw new Error('this group not has members') }

            if (members?.length !== (await User.find({ _id: { $in: members } })).length) { throw new Error('this some member of members passed not exists.') }

            if (admins?.length > 0) {
                if (admins?.length !== (await User.find({ _id: { $in: admins } })).length) { throw new Error('this some admin of admins passed not exists.') }
            }
            
            const group = await Group.create({ user, name, admins: [user], members: [user].concat(members), conversations: [] })

            // é criado uma promise com await e é percorrido as contas relacionadas há essa mensagem sem repetir
            await Promise.all(group.members?.map(async member => {
                const creator = group.user; // pega o criador da mensagem
                const self = creator.equals(member) // verifica se o criador é o mesmo account
                
                //aqui busca se existe uma conversa na account, com a direção acima ou um grupo caso exista
                const existsConversation = await Conversation.findOne({ user: member, group: group._id })
        
                if (existsConversation) { // caso exista
                    await existsConversation.update({ $set: { group: group._id } })// é adicionado a mensagem 
                    // aqui estou atrelando a mensagem as conversas, para poder controlar quando devo retirala caso ninguem tenha mais uma conversa que a prenda
                    group.conversations.push(existsConversation._id)
                } else { // caso não
                    // é criado uma conversa com a mesma direção acima e grupo, é criado um array de messages e adicionado nele
                    const conversation = await ConversationService.create({ user: member, group: group._id })

                    // aqui estou atrelando a mensagem as conversas, para poder controlar quando devo retirala caso ninguem tenha mais uma conversa que a prenda
                    group.conversations.push(conversation._id)
                    // aqui é adicionado ao array de conversas do usuario essa nova conversa craida acima.
                    await User.updateOne({ _id: member }, { $push: { conversations: conversation._id } })
                }

                await User.updateOne({ _id: member }, { $push: { groups: group._id } })

                return true
            }))

            // aqui estou salvando as alterações do push, o bom de fazer isso que ele salva no objeto e no banco as alterações, 
            //assim n fazendo o processo a cada linha, somente nessa
            await group.save()

            // if (reply) {
            //     await Message.updateOne({ _id: reply }, { $push: {  replies: message._id } })
            // }

            // if (mentions?.length > 0) {
            //     await User.updateOne({ _id: { $in: mentions } }, { $push: { mentions: message._id } })
            // }

            return await Group.populate(group, [
                { path: 'user', model: 'User' },
                { path: 'admins', model: 'User' },
                { path: 'members', model: 'User' },
                { path: 'conversations', model: 'Conversation' },
                { path: 'messages', model: 'Message' },
                // { path: 'reactions', model: 'Reaction' },
            ]);
        } catch (err) { throw new Error('Error for send message ' + err?.message) }
    }


    async remove ({ _id, user }) {
        try {
            const message = await Message.findOne({ _id, user })
            
            if (!message) { throw new Error('message not found')}

            await message.remove()

            // tira as mensagens de todas as conversas
            await Conversation.updateMany({ _id: { $in: message.conversations } }, { $pull: { messages: message._id } })

            if (message?.reply) {
                await Message.updateOne({ _id: message.reply }, { $pull: {  replies: message._id } })
            }
        
            if (message?.mentions?.length > 0) {
                await User.updateOne({ _id: { $in: message.mentions } }, { $pull: { mentions: message._id } })
            }
        
            return message;
    
        } catch (err) { throw new Error('Error for send message ' + err?.message) }
    }
}


module.exports = new GroupService()