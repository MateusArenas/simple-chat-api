const User = require('../schemas/User')

class UserController {

    async index (req, res) { // this controller as register account
        const auth = res.locals.user;

        console.log(auth);
        try {
            const users = await User.find()
        
            const data = users.map(user => {

                const self = user?._id?.equals(auth)

                return { ...user?.toObject(), self }
            })


            return res.json(data)
        } catch (err) { throw new Error('Index not user ' + err?.message) }
    }
}

module.exports = new UserController()
