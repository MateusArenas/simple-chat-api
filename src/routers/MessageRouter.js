const MessageService = require('../services/MessageService');
const { authVerify } = require('../middlewares/auth')

const MessageRouter = {
    Get: {
        ['/messages']: {
            ['/']: async ({ headers: { authorization } }, res) => {
                const messages = await MessageService.index({ match: {} }, authorization)
                return res.json(messages)
            },
            ['/:id']: async ({ headers: { authorization } }, res)  => {
                const message = await MessageService.search({ match: {} }, authorization)
                return res.json(message)
            },
        }
    },
    Post: {
        ['/messages']: async ({ headers: { authorization: token } }, res) => await authVerify(token, 
            async user => {
                const message = await MessageService.create({ ...req.body, user })
                return res.json(message)
            }
        ),
    },
    Delete: {
        ['/messages/:id']: async ({ params, headers: { authorization: token } }, res) => await authVerify(token, 
            async user => {
                const message = await MessageService.remove({ _id: params.id, user })
                return res.json(message)
            }
        ),
    }
}

module.exports = MessageRouter
