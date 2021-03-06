const { Schema, model } = require('mongoose')
const bcrypt = require('bcryptjs')

const UserSchema = new Schema({
  uri: {
    type: String,
  },
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
  verified: { 
    type: Boolean,
    default: false,
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  groups: [{
    type: Schema.Types.ObjectId,
    ref: 'Group'
  }],
  conversations: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Conversation'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  reactions: [{
    type: Schema.Types.ObjectId,
    ref: 'Reaction'
  }],
  public: { // visto para todos, account, moments, caso false somente para seguidores.
    type: Boolean, 
    default: true 
  },
  followers: [{//seguidores
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{//seguindo
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],

  blocklist: [{//lista de bloqueados
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends:  [{//lista de melhores amigos
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  expiredAt: {
    type: Date,
    default: Date.now,
    expires: '2d'
  },
}, {
  timestamps: true,
})


UserSchema.pre('save', async function(next) {
  if (this.get('password')) {
    const hash = await bcrypt.hash(this.get('password'), 10)
    this.set('password', hash)
  }

  next()
})

module.exports = model('User', UserSchema, 'User')