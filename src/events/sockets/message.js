const mongoose = require("mongoose");
const Message = require("../../schemas/Message");
const User = require("../../schemas/User");
const { sendMessage } = require("../../services/messageService");


function toJSON (document, extra={}) {
    return ({ ...JSON.parse(JSON.stringify(document)), ...extra })
}

async function message (socket, io) {
    const auth = socket.user;

    // const messages = await Message.aggregate([
    //     { $match: {name: new RegExp(search)} },
    //     { 
    //         $addFields: { 
    //             chat: { $in: [mongoose.Types.ObjectId(auth), '$receivers'] }  
    //         } 
    //     },
    //     { $group: { _id: '$chat' } },
    //     { $limit: 5 }
    // ])

    // console.log(messages);

    // socket.emit('previousMessages', messages)

    socket.on('Join in Chat', async ({ receiver }) => {

        if (!await User.findById(receiver)) { throw new Error("Chat User not found") }

        const messages = await Message.find({ $or: [{ user: auth, receivers: receiver }, { user: receiver, receivers: auth }] })

        console.log(messages);
        try {
    
            const data = await Promise.all(messages.map(async message => {
               const user = await User.findById(message.user);
               return toJSON(message, { author: user.email  })
            }))
    
            socket.emit('previousChatMessages', data)
    
        } catch(err) {
            console.log(err);
        }
    })

    
    socket.on('sendMessage', async data => {
        try {
            const user = await User.findById(auth);
            
            const message = await sendMessage({ user: auth, ...data });
            
            // socket.broadcast.emit('receivedMessage', data)
    
            message?.receivers?.forEach(receiver => {
                io.sockets.in(`user ${receiver}`).emit('receivedMessage', toJSON(message, { author: user.email }) );
            });
    
            // socket.to(data.to).emit('receivedMessage', message)
        } catch (err) {
            console.log(err);
        }

    })
}

module.exports = message