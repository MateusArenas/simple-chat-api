const UserService = require('../services/UserService');

const UserRouter = {
    Get: {
        ['/users']: {
            ['/']: async ({ headers: { authorization } }, res) => {
                const messages = await UserService.index({ match: {} }, authorization)
                return res.json(messages)
            },
        }
    },
}

module.exports = UserRouter
