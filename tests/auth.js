const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const authConfig = require('../src/config/auth.json')
const api = require('./api')

async function main () {
    try {
        const email = 'mateusarenas97@gmail.com';
        const password = '12345';

        const { data: register } = await api.post('/register', { email, password });

        if (register?.user?.email !== email.toLowerCase()) { throw new Error('user email is not compatible for email in creation!') }

        if (password !== register?.user?.password) { throw new Error('user password is not equal in creation!') }

        jwt.verify(register?.token, authConfig.secret, (err, decoded) => {
            if(err) { throw new Error('Token invalid') }
            
            if (register?.user?._id !== decoded.id) { throw new Error('Not is self user!') }
        })

        /// authenticated

        const { data: authenticate } = await api.post('/authenticate', { email, password });

        if (register?.user?._id !== authenticate?.user?._id) { throw new Error('user authenticate _id is not compatible for user register _id!') }

        if (password !== authenticate?.user?.password) { throw new Error('user password is not incripted in authenticate!') }

        jwt.verify(authenticate?.token, authConfig.secret, (err, decoded) => {
            if(err) { throw new Error('Token invalid') }
            
            if (authenticate?.user?._id !== decoded.id) { throw new Error('Not is self user!') }
        })
        
    } catch (err) {
        console.log(err);
    }
}

module.exports = main;