const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const Message = require("../schemas/Message");
const User = require("../schemas/User");
const aggregate = require('../utils/aggregate')

class MessageService {

    async index ({ match, options }, authorization) {
        const auth = await AuthAsync.getAuthUser(authorization)
        try {
            const [messages] = await Message.aggregate([
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

            return messages
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

    async create ({ user, content, receivers, reply, mentions }) {
        try {
    
         if (content?.length < 1) { throw new Error('message content is lower 1 caracters') }
    
         if(!receivers?.length) { throw new Error('this message not has receivers') }
    
         const message = await Message.create({ user, content, receivers, reply, mentions })
    
         await User.updateOne({ _id: user }, { $push: { messages: message._id } })
    
         if (receivers?.length > 0) {
             await User.updateOne({ _id: { $in: receivers } }, { $push: { receives: message._id } })
         }
    
         if (reply) {
             await Message.updateOne({ _id: reply }, { $push: {  replies: message._id } })
         }
    
         if (mentions?.length > 0) {
             await User.updateOne({ _id: { $in: mentions } }, { $push: { mentions: message._id } })
         }
    
         return message;
    
        } catch (err) { throw new Error('Error for send message ' + err?.message) }
    }

    async remove ({ _id, user }) {
        try {
            const message = await Message.findOne({ _id, user })
            
            if (!message) { throw new Error('message not found')}

            await message.remove()

            await User.updateOne({ _id: user }, { $pull: { messages: message._id } })
        
            if (message?.receivers?.length > 0) {
                await User.updateOne({ _id: { $in: message.receivers } }, { $pull: { receives: message._id } })
            }
        
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