const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const Conversation = require("../schemas/Conversation");
const User = require("../schemas/User");
const Message = require("../schemas/Message");
const aggregate = require('../utils/aggregate');
const Group = require("../schemas/Group");

class ConversationService {

    async index ({ match, options }, authorization) {
        console.log('index conversations');
        const auth = await AuthAsync.getAuthUser(authorization)

        console.log({ authorization, auth });

        try {
            const [conversations] = await Conversation.aggregate([
                { $match: aggregate.match(match) },
                { $sort: { updatedAt: -1 } },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                        lastMessage: { $last: '$messages' }
                    }
                },
                {
                    $lookup: {
                        from: 'Message', // name of mongoDB collection, NOT mongoose model
                        localField: 'messages', // referenced stores _id in the tests collection
                        foreignField: '_id', // _id from stores
                        pipeline : [{ $project : { _id: 1, readers: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }],
                        as: '_messages' // output array in returned object
                    },
                },
                { $set: { messages: { $map: { input: "$_messages", as: "message", in: "$$message._id" } } } },
                {
                    $addFields: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$_messages", [] ] }, initialValue: 0,
                                in: { $cond: [{ $in: [new mongoose.Types.ObjectId(auth), "$$this.readers"] },  "$$value", { $sum: ["$$value", 1] }] }
                            }
                        }
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
                { $unset: ["results._messages"] } 
            ])

            const results = await Conversation.populate(conversations?.results, [
                { path: 'user', model: 'User'  },
                { path: 'direct', model: 'User'  },
                { path: 'group', model: 'Group'  },
                { path: 'messages', model: 'Message', 
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
                        doc._doc.read = doc?.receivers?.map(receiver => doc?.readers?.find(reader => receiver?.equals(reader)))?.reduce((acc, cond) => acc&&cond, true)
                        doc._doc.visualized = !!doc?.readers?.find(reader => reader?.equals(auth))
                        return doc
                    } 
                },
                { path: 'lastMessage', model: 'Message', populate: [{ path: 'user' }],
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
                        doc._doc.read = doc?.receivers?.map(receiver => doc?.readers?.find(reader => receiver?.equals(reader)))?.reduce((acc, cond) => acc&&cond, true)
                        doc._doc.visualized = !!doc?.readers?.find(reader => reader?.equals(auth))
                        return doc
                    }
                },
            ])

            return ({ ...conversations, results  })
        } catch (err) { throw new Error('Error for index conversations ' + err?.message) }
    }

    async search ({ match, options }, authorization) {
        const auth = await AuthAsync.getAuthUser(authorization)
        try {
            const [conversation] = await Conversation.aggregate([
                { $match: aggregate.match(match) },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$user", new mongoose.Types.ObjectId(auth)] }, true, false] },
                        lastMessage: { $last: '$messages' }
                    }
                },
                {
                    $lookup: {
                        from: 'Message', // name of mongoDB collection, NOT mongoose model
                        localField: 'messages', // referenced stores _id in the tests collection
                        foreignField: '_id', // _id from stores
                        pipeline : [{ $project : { _id: 1, readers: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }],
                        as: '_messages' // output array in returned object
                    },
                },
                { $set: { messages: { $map: { input: "$_messages", as: "message", in: "$$message._id" } } } },
                {
                    $addFields: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$_messages", [] ] }, initialValue: 0,
                                in: { $cond: [{ $in: [new mongoose.Types.ObjectId(auth), "$$this.readers"] },  "$$value", { $sum: ["$$value", 1] }] }
                            }
                        }
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
                { $unset: ["_messages"] } 
            ])

            const result = await Conversation.populate(conversation, [
                { path: 'user', model: 'User'  },
                { path: 'direct', model: 'User'  },
                { path: 'group', model: 'Group'  },
                { path: 'messages', model: 'Message', 
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
                        doc._doc.read = doc?.receivers?.map(receiver => doc?.readers?.find(reader => receiver?.equals(reader)))?.reduce((acc, cond) => acc&&cond, true)
                        doc._doc.visualized = !!doc?.readers?.find(reader => reader?.equals(auth))
                        return doc
                    } 
                },
                { path: 'lastMessage', model: 'Message', populate: [{ path: 'user' }],
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
                        doc._doc.read = doc?.receivers?.map(receiver => doc?.readers?.find(reader => receiver?.equals(reader)))?.reduce((acc, cond) => acc&&cond, true)
                        doc._doc.visualized = !!doc?.readers?.find(reader => reader?.equals(auth))
                        return doc
                    }
                },
            ])

            return result
        } catch (err) { throw new Error('Error for search user ' + err?.message) }
    }

    async create ({ user, direct, group, messages }) {
        try {
            if (!group && !messages?.length) { throw new Error('not have open message in this conversation of type direct.') }

            if (direct && !await User.findById(direct)) { throw new Error('this direct passed not exists.') }

            if (group && !await Group.findById(group)) { throw new Error('this group passed not exists.') }

            if (messages?.length > 0) {
                if (messages?.length !== (await Message.find({ _id: { $in: messages } })).length) { throw new Error('this some message of messages passed not exists.') }
            }

            //verifica para não criar duplicatas
            if (await Conversation.findOne({ user, direct, group })) { throw new Error('conversation has exists.') }
            //pega todas as mensagens que foram desassociadas há uma conversa equivalente.
            // const losts = await Message.find({ direct, group, receivers: user })

            // const conversation = await Conversation.create({ user, direct, group, messages: losts.concat(messages) })
            const conversation = await Conversation.create({ user, direct, group, messages })

            //aqui faz com que as mensagens sejam associadas a conversa e tira 
            // await Message.updateMany({ direct, group, receivers: user, conversations: { $nin: [conversation._id] } }, { 
            //     $push: { conversations: conversation._id },
            //     $set: { expiredAt: null },
            // })
        
            return conversation;
        } catch (err) { throw new Error('Error for send conversation ' + err?.message) }
    }

    async remove ({ _id, user }) {
        try {
            const conversation = await Conversation.findOne({ _id, user })

            if (!conversation) { throw new Error('conversation not found')}
            
            await conversation.remove()

            //remove de todas as mensagens a referencia da conversa
            await Message.updateMany({ conversations: conversation._id, receivers: user }, { $pull: { conversations: conversation._id } })

            //faz com q todas as mensagens que não tem conversas terem uma expiração
            await Message.updateMany({ conversations: [], receivers: user }, { $set: { expiredAt: new Date() } })
            
            //remove a referencia do usuario sobre a conversa
            await User.updateOne({ _id: user }, { $pull: { conversations: conversation._id } })
        
            return conversation;
        } catch (err) { throw new Error('Error for send conversation ' + err?.message) }
    }
}

// messagem = 
// quando todos os receptores da mensagem excluirem a conversa 
// = expireAt 24h => rodada depois de ser enviada para todos os que tem receber.

module.exports = new ConversationService()