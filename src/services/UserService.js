const mongoose = require("mongoose");
const AuthAsync = require("../middlewares/auth");
const User = require("../schemas/User");
const aggregate = require('../utils/aggregate')

class UserService {

    async index ({ match, options }, authorization) {
        const auth = await AuthAsync.getAuthUser(authorization)
        try {
            const [users] = await User.aggregate([
                { $match: aggregate.match(match) },
                {
                    $addFields: {
                        self: { $cond: [{ $eq: ["$_id", new mongoose.Types.ObjectId(auth)] }, true, false] },
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
        
            return users
        } catch (err) { throw new Error('Error for index messages ' + err?.message) }
    }
}

module.exports = new UserService()