const express = require('express');
const http = require('http');
const socket = require('socket.io');
require('express-async-errors')
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

const routes = require('./routes')
const sockets = require('./events/sockets')

class App {
    constructor() {
        this.express = express();
        this.server = http.createServer(this.express);
        this.io = socket(this.server, { cors: { origin: '*' } });
        this.handleMiddlewares();
        this.handleDatabase();
        this.handleRoutes();
        this.handleErrorMiddlewares();
        this.handleSockets();
    }

    handleMiddlewares() {
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(morgan('dev'))
        this.express.use(cors());
    }

    handleErrorMiddlewares () {
        this.express.use((err, req, res, next) => {
            const error = { message: err.message }
            if (err instanceof Error) { return res.status(400).json(error) } 
            return res.status(500).json(error)
        })
    }

    handleDatabase() {
        mongoose.connect('mongodb://localhost:27017/simple-chat-db?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            ignoreUndefined: true,  
            authSource: 'admin',
        })
        mongoose.connection.on('error', () => console.error('connection error:'))
        mongoose.connection.once('open', () => console.log('database connected'))
    }

    handleRoutes() {
        this.express.use(routes);
    }

    handleSockets() {
        this.io.on('connection', sockets)
    }
}

module.exports = new App().server;