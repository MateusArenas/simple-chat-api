const { Schema, model } = require('mongoose')

const GroupSchema = new Schema({
  name: {
      type: String,
      default: 'new group'
  },
  user: {
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

  reactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Reaction'
  }],
}, {
  timestamps: true,
})

module.exports = model('Group', GroupSchema, 'Group')