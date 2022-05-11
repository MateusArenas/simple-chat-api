const { Schema, model } = require('mongoose')

const ConversationSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    direct: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    group: {
        type: Schema.Types.ObjectId,
        ref: 'Group'
    },
    messages: [{
        type: Schema.Types.ObjectId,
        ref: 'Message'
    }],
}, {
  timestamps: true,
})

// ConversationSchema.virtual('lastMessage').get(function() {
//     if (this.messages?.length > 0) {
//         return this.messages(this.messages?.length-1);
//     }
//     return null
// });

module.exports = model('Conversation', ConversationSchema, 'Conversation')