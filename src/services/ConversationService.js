const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const Conversation = require("../schemas/Conversation");
const User = require("../schemas/User");
const aggregate = require('../utils/aggregate')

class ConversationService {

    async index ({ match, options }, authorization) {
        console.log('index conversations');
        const auth = await AuthAsync.getAuthUser(authorization)

        console.log({ authorization, auth });

        try {
            const [conversations] = await Conversation.aggregate([
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
                        pipeline : [{ $project : { _id: 1, viewers: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }],
                        as: '_messages' // output array in returned object
                    },
                },
                { $set: { messages: { $map: { input: "$_messages", as: "message", in: "$$message._id" } } } },
                {
                    $addFields: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$_messages.viewers", [] ] }, initialValue: [],
                                in: { $concatArrays: ["$$value", { $cond: [{ $eq: ["$$this", []] }, [null], "$$this"] }] }
                            },
                        }
                    }
                },
                {
                    $set: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$news", [] ] }, initialValue: 0,
                                in: { $cond: [{ $eq: ["$$this", new mongoose.Types.ObjectId(auth)] },  { $sum: ["$$value", 0] }, { $sum: ["$$value", 1] }] }
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
                { $unset: ["results._messages"] } 
            ])

            const results = await Conversation.populate(conversations?.results, [
                { path: 'user', model: 'User'  },
                { path: 'direct', model: 'User'  },
                { path: 'group', model: 'Group'  },
                { path: 'messages', model: 'Message', 
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
                        return doc
                    } 
                },
                { path: 'lastMessage', model: 'Message', populate: [{ path: 'user' }],
                    transform: doc => {
                        doc._doc.self = doc?.user?._id?.equals(auth)
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
                        pipeline : [{ $project : { _id: 1, viewers: 1, createdAt: 1 } }, { $sort: { createdAt: -1 } }],
                        as: '_messages' // output array in returned object
                    },
                },
                { $set: { messages: { $map: { input: "$_messages", as: "message", in: "$$message._id" } } } },
                {
                    $addFields: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$_messages.viewers", [] ] }, initialValue: [],
                                in: { $concatArrays: ["$$value", { $cond: [{ $eq: ["$$this", []] }, [null], "$$this"] }] }
                            },
                        }
                    }
                },
                {
                    $set: {
                        news: {
                            $reduce: {
                                input: { $ifNull: [ "$news", [] ] }, initialValue: 0,
                                in: { $cond: [{ $eq: ["$$this", new mongoose.Types.ObjectId(auth)] },  { $sum: ["$$value", 0] }, { $sum: ["$$value", 1] }] }
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
                { $unset: ["_messages"] } 
            ])

            const result = await Conversation.populate(conversation, [
                { path: 'user', model: 'User'  },
                { path: 'direct', model: 'User'  },
                { path: 'group', model: 'Group'  },
                { path: 'messages', model: 'Message', transform: doc => {
                        doc._doc.self = doc?.user?.equals(auth)
                        return doc
                    }
                },
                { path: 'lastMessage', model: 'Message', populate: [{ path: 'user' }]  },
            ])

            return result
        } catch (err) { throw new Error('Error for search user ' + err?.message) }
    }
}

module.exports = new ConversationService()