const { Schema, model } = require('mongoose')

const MessageSchema = new Schema({
  outstanding: {
    type: String,
  },
  content: {
      type: String,
      required: true
  },
  conversations: [{
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  }],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  deliveries: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  readers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  favorites: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
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
  direct: { 
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  group: { // case group exists fixed in group this message and when organize conersations using criterio in first operations.
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  moment: { // case moment exists fixed in moment and direct
    type: Schema.Types.ObjectId,
    ref: 'Moment'
  },

  reactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Reaction'
  }],
  expiredAt: {
    type: Date,
    default: null,
    expires: '1d'
  },
}, {
  timestamps: true,
})

module.exports = model('Message', MessageSchema, 'Message')