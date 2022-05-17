const { authVerify } = require('../middlewares/auth');
const ConversationService = require('../services/ConversationService');

const ConversationRouter = {
    Delete: {
        ['/conversations/:id']: async ({ params, headers: { authorization: token } }, res) => await authVerify(token, 
            async user => {
                const conversation = await ConversationService.remove({ _id: params.id, user })
                return res.json(conversation)
            }
        ),
    }
}

module.exports = ConversationRouter
