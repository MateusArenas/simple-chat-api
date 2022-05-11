const UserService = require('../services/UserService');
const Conversation = require('../services/ConversationService');

const UserRouter = {
    Get: {
        ['/users']: {
            ['/']: async ({ headers: { authorization } }, res) => {
                const data = await UserService.index({ match: {} }, authorization)
                return res.json(data)
            },
            ['/:user']: {
                ['/']: async ({ params: { user }, headers: { authorization } }, res) => {
                    const data = await UserService.search({ match: { _id: user } }, authorization)
                    return res.json(data)
                },
                ['/conversations']: {
                    ['/']: async ({ params: { user }, headers: { authorization } }, res) => {
                        const data = await Conversation.index({ match: { user } }, authorization)
                        return res.json(data)
                    },
                    ['/:conversation']: async ({ params: { user, conversation }, headers: { authorization } }, res) => {
                        const data = await Conversation.search({ match: { _id: conversation, user } }, authorization)
                        return res.json(data)
                    },
                }
            }
        }
    },
}

module.exports = UserRouter
