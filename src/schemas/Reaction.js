const { Schema, model } = require('mongoose')

const ReactionSchema = new Schema({
  type: {
    type: String, 
    enum : ['like', 'favorite', 'fire'], 
    require: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  group: { 
    type: Schema.Types.ObjectId,
    ref: 'Group'
  },
  moment: { 
    type: Schema.Types.ObjectId,
    ref: 'Moment'
  },
}, {
  timestamps: true,
})

module.exports = model('Reaction', ReactionSchema, 'Reaction')