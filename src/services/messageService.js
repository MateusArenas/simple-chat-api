const Message = require("../schemas/Message");
const User = require("../schemas/User");

async function sendMessage ({ user, content, receivers, reply, mentions }) {
    try {

     if (content?.length < 1) { throw new Error('message content is lower 1 caracters') }

     if(!receivers?.length) { throw new Error('this message not has receivers') }

     const message = await Message.create({ user, content, receivers, reply, mentions })

     await User.updateOne({ _id: user }, { $push: { messages: message._id } })

     await User.updateOne({ _id: { $in: receivers } }, { $push: { receives: message._id } })

     if (reply) {
         await Message.updateOne({ _id: reply }, { $push: {  replies: message._id } })
     }

     if (mentions?.length > 0) {
         await User.updateOne({ _id: { $in: mentions } }, { $push: { mentions: message._id } })
     }

     return message;

    } catch (err) { throw new Error('Error for send message ' + err?.message) }
}

module.exports = { sendMessage }