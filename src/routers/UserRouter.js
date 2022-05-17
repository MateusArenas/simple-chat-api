const UserService = require('../services/UserService');
const ConversationService = require('../services/ConversationService');
const MessageService = require('../services/MessageService');
const User = require('../schemas/User');

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
                        const data = await ConversationService.index({ match: { user } }, authorization)
                        return res.json(data)
                    },
                    ['/directs']: {
                        ['/']: async ({ params: { user }, headers: { authorization } }, res) => {
                            const data = await ConversationService.index({ match: { user, direct: { $exists: true } } }, authorization)
                            return res.json(data)
                        },
                        ['/:direct']: {
                            ['/']: async ({ params: { user, direct }, headers: { authorization } }, res) => {
                                const data = await ConversationService.search({ match: { user, $or: [{ direct }, { direct: user }] } }, authorization)
                                return res.json(data)
                            },
                            //this route has in direct screen
                            ['/messages']: async ({ params: { user, direct }, query: { skip, limit }, headers: { authorization } }, res) => {
                                const data = await MessageService.index({ match: { $or: [{ direct, user }, { user: direct, direct: user }]  }, options: { skip, limit } }, authorization)
                                return res.json(data)
                            },
                        }
                    },
                    ['/groups']: {
                        ['/']: async ({ params: { user }, headers: { authorization } }, res) => {
                            const data = await ConversationService.index({ match: { user, group: { $exists: true } } }, authorization)
                            return res.json(data)
                        },
                        ['/:group']: {
                            ['/']: async ({ params: { user, group }, headers: { authorization } }, res) => {
                                const data = await ConversationService.search({ match: { user, group } }, authorization)
                                return res.json(data)
                            },
                            //this route has in group screen
                            ['/messages']: async ({ params: { user, group }, query: { skip, limit }, headers: { authorization } }, res) => {
                                const data = await MessageService.index({ match: { user, group }, options: { skip, limit } }, authorization)
                                return res.json(data)
                            },
                        }
                    },
                    ['/:conversation']: {
                        ['/']: async ({ params: { user, conversation }, headers: { authorization } }, res) => {
                            const data = await ConversationService.search({ match: { _id: conversation, user } }, authorization)
                            return res.json(data)
                        },

                        ['/messages']: async ({ params: { user, conversation }, headers: { authorization } }, res) => {
                            const data = await MessageService.index({ match: { conversations: conversation, user } }, authorization)
                            return res.json(data)
                        },
                    }
                }
            }
        }
    },
}

module.exports = UserRouter
