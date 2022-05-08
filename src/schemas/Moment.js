const { Schema, model } = require('mongoose')

const MomentSchema = new Schema({
  uri: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  viewers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
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
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
}, {
  timestamps: true,
})

module.exports = model('Moment', MomentSchema, 'Moment')