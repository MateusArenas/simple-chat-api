const path = require('path')

const DefaultRouter = {
    Get: {
        ['/']: async ({ }, res) => {
            return res.json({ api: 'run' })
        },
        ['/chat']: async ({ }, res) => {
            res.sendFile(path.join(__dirname, '../', '../', '/socket.html'));
        },
    },
}

module.exports = DefaultRouter
