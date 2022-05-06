const { Schema, model } = require('mongoose')

const MessageSchema = new Schema({
  content: {
      type: String,
      required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  receivers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reply: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
}, {
  timestamps: true,
})

module.exports = model('Message', MessageSchema, 'Message')