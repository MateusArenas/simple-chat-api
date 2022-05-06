const { Schema, model } = require('mongoose')

const GroupSchema = new Schema({
  about: String,
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
}, {
  timestamps: true,
})

module.exports = model('Group', GroupSchema, 'Group')