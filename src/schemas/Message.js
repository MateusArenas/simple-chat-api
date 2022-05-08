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
}, {
  timestamps: true,
})

module.exports = model('Message', MessageSchema, 'Message')