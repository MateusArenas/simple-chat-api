const { Schema, model } = require('mongoose')

const ChatSchema = new Schema({
  about: String,
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
}, {
  timestamps: true,
})

module.exports = model('Chat', ChatSchema, 'Chat')