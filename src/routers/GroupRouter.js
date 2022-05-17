const GroupService = require('../services/GroupService');
const { authVerify } = require('../middlewares/auth');

const GroupRouter = {
    Get: {
        ['/groups']: {
            ['/']: async ({ headers: { authorization } }, res) => {
                const groups = await GroupService.index({ match: {} }, authorization)
                return res.json(groups)
            },
            ['/:id']: async ({ params, headers: { authorization } }, res)  => {
                const group = await GroupService.search({ match: { _id: params.id } }, authorization)
                return res.json(group)
            },
        }
    },
    Post: {
        ['/groups']: async ({ headers: { authorization: token }, body }, res) => await authVerify(token, 
            async user => {
                const group = await GroupService.create({ ...body, user })
                return res.json(group)
            }
        ),
    },
    Delete: {
        ['/groups/:id']: async ({ params, headers: { authorization: token } }, res) => await authVerify(token, 
            async user => {
                const group = await GroupService.remove({ _id: params.id, user })
                return res.json(group)
            }
        ),
    }
}

module.exports = GroupRouter
