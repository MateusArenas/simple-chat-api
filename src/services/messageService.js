const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const Message = require("../schemas/Message");
const Conversation = require("../schemas/Conversation");
const User = require("../schemas/User");
const Group = require("../schemas/Group");
const aggregate = require('../utils/aggregate');
const ConversationService = require("./ConversationService");

class MessageService {

    async index ({ match, options }, authorization) { // busca todos
        const auth = await AuthAsync.getAuthUser(authorization)
        try {
            const [messages] = await Message.aggregate([
                { $match: aggregate.match(match) },
                { $sort: { createdAt: -1 } },
                { $skip: Number(options?.skip) || 0 }, { $limit: Number(options?.limit) || 999999999 },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                        delivered: { 
                            $allElementsTrue: {
                                $reduce: {
                                    input: { $ifNull: ["$receivers", []] }, initialValue: [],
                                    in: { 
                                        $cond: [{ $in: ["$$this", { $ifNull: ["$deliveries", []] }] },
                                            { $concatArrays : ["$$value", [true]] }, 
                                            { $concatArrays : ["$$value", [false]] }
                                        ]
                                    },
                                }
                            },
                        },
                        read: { 
                            $allElementsTrue: {
                                $reduce: {
                                    input: { $ifNull: ["$receivers", []] }, initialValue: [],
                                    in: { 
                                        $cond: [{ $in: ["$$this", { $ifNull: ["$readers", []] }] },
                                            { $concatArrays : ["$$value", [true]] }, 
                                            { $concatArrays : ["$$value", [false]] }
                                        ]
                                    },
                                }
                            },
                        },
                        visualized: {
                            $reduce: {
                                input: { $ifNull: [ "$readers", [] ] }, initialValue: false,
                                in: { $cond: [{ $eq: ["$$this", new mongoose.Types.ObjectId(auth)] }, true, false] }
                            }
                        },
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

            const results = await Message.populate(messages?.results, [
                { model: 'User', path: 'user', select: ['_id', 'email'],  },
                { model: 'User', path: 'receivers', select: ['_id', 'email'] },
                { model: 'User', path: 'direct', select: ['_id', 'email'] },
                { model: 'Group', path: 'group', select: ['_id', 'name'] },
            ])

            return ({ ...messages, results  })
        } catch (err) { throw new Error('Error for index messages ' + err?.message) }
    }

    async search ({ match, options }, authorization) {
        const auth = await AuthAsync.getAuthUser(authorization)
        try {

            const [message] = await Message.aggregate([
                { $match: aggregate.match(match) },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                        delivered: { 
                            $allElementsTrue: {
                                $reduce: {
                                    input: { $ifNull: ["$receivers", []] }, initialValue: [],
                                    in: { 
                                        $cond: [{ $in: ["$$this", { $ifNull: ["$deliveries", []] }] },
                                            { $concatArrays : ["$$value", [true]] }, 
                                            { $concatArrays : ["$$value", [false]] }
                                        ]
                                    },
                                }
                            },
                        },
                        read: { 
                            $allElementsTrue: {
                                $reduce: {
                                    input: { $ifNull: ["$receivers", []] }, initialValue: [],
                                    in: { 
                                        $cond: [{ $in: ["$$this", { $ifNull: ["$readers", []] }] },
                                            { $concatArrays : ["$$value", [true]] }, 
                                            { $concatArrays : ["$$value", [false]] }
                                        ]
                                    },
                                }
                            },
                        },
                        visualized: {
                            $reduce: {
                                input: { $ifNull: [ "$readers", [] ] }, initialValue: false,
                                in: { $cond: [{ $eq: ["$$this", new mongoose.Types.ObjectId(auth)] }, true, false] }
                            }
                        },
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

            return message
        } catch (err) { throw new Error('Error for search message ' + err?.message) }
    }

    async create ({ user, content, receivers, reply, mentions, direct, group, outstanding }) {
        try {
            if (content?.length < 1) { throw new Error('message content is lower 1 caracters') }
            
            if(!receivers?.length) { throw new Error('this message not has receivers') }

            if (receivers?.length !== (await User.find({ _id: { $in: receivers } })).length) { throw new Error('this some receiver of receivers passed not exists.') }
            
            if(!direct && !group) { throw new Error('this message is not defined for direct or group') }

            if (direct && !await User.findById(direct)) { throw new Error('this direct passed not exists.') }

            if (group && !await Group.findById(group)) { throw new Error('this group passed not exists.') }

            if (reply && !await Message.findById(reply)) { throw new Error('this reply passed not exists.') }

            if (mentions?.length !== (await User.find({ _id: { $in: mentions } })).length) { throw new Error('this some mention of mentions passed not exists.') }

            const to = [user].concat(receivers?.filter(receiver => receiver !== user))
            const message = await Message.create({ user, content, receivers: to, reply, mentions, direct, group, outstanding, readers: [user] })

            // é criado uma promise com await e é percorrido as contas relacionadas há essa mensagem sem repetir
            await Promise.all(message.receivers?.map(async account => {
                const creator = message.user; // pega o criador da mensagem
                const self = creator.equals(account) // verifica se o criador é o mesmo account

                // ve a direção se n for do tipo grupo | se for do proprio o direct é o que vem acima, caso n será enviado para o criador
                const direction = group ? null : self ? direct : creator; 
                
                //aqui busca se existe uma conversa na account, com a direção acima ou um grupo caso exista
                const existsConversation = await Conversation.findOne({ user: account, direct: direction, group })
        
                if (existsConversation) { // caso exista
                    await existsConversation.update({ $push: { messages: message._id } })// é adicionado a mensagem 
                    // aqui estou atrelando a mensagem as conversas, para poder controlar quando devo retirala caso ninguem tenha mais uma conversa que a prenda
                    message.conversations.push(existsConversation._id)
                } else { // caso não
                    // é criado uma conversa com a mesma direção acima e grupo, é criado um array de messages e adicionado nele
                    const conversation = await ConversationService.create({ user: account, direct: direction, group, messages: [message._id] })
                    // aqui estou atrelando a mensagem as conversas, para poder controlar quando devo retirala caso ninguem tenha mais uma conversa que a prenda
                    message.conversations.push(conversation._id)
                    // aqui é adicionado ao array de conversas do usuario essa nova conversa craida acima.
                    await User.updateOne({ _id: account }, { $push: { conversations: conversation._id } })
                }

                return true
            }))

            // aqui estou salvando as alterações do push, o bom de fazer isso que ele salva no objeto e no banco as alterações, 
            //assim n fazendo o processo a cada linha, somente nessa
            await message.save()

            if (group) {
                await Group.updateOne({ _id: group }, { $push: { messages: message._id } })
            }

            if (reply) {
                await Message.updateOne({ _id: reply }, { $push: {  replies: message._id } })
            }

            if (mentions?.length > 0) {
                await User.updateOne({ _id: { $in: mentions } }, { $push: { mentions: message._id } })
            }

            console.log('dentro length', message?.conversations?.length);

            return await Message.populate(message, [
                { path: 'user', model: 'User' },
                { path: 'conversations', model: 'Conversation', populate: [{ path: 'direct', model: 'User' }, { path: 'group', model: 'Group' }] },
                { path: 'direct', model: 'User' },
                { path: 'group', model: 'Group' },
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


module.exports = new MessageService()