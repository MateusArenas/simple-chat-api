# simple-chat-api

user
   _id
   name: string
   phoneNumber: string
   password: string
   chats: array chat
   messages: array message
   
chat
   _id
   creator: user
   admins: array users
   members: array users
   about: string
   messages: array message

message
   _id
   user: user
   chat: chat
   content: string
   reply: message
   replies: array message
   mentions: array user