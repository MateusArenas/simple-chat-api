const { Schema, model } = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new Schema({
  name: { 
    type: String, 
    require: true 
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  verified: { // fazer com que certas ações só vão ser feitas caso esteje verificado
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  receives: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  verifiedToken: {
    type: String,
    default: Date.now
  },
  passwordResetToken: {
    type: String,
    default: Date.now
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  expiredAt: { // caso não ative em 2 dias será desativada
    type: Date,
    default: Date.now,
    expires: '2d'
  },
}, {
  timestamps: true,
})


UserSchema.pre('save', async function(next) {
  const hash = await bcrypt.hash(this.get('password'), 10)
  this.set('password', hash)

  next()
})

module.exports = model('User', UserSchema, 'User')