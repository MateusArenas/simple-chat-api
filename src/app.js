const express = require('express');
require('express-async-errors')
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');

const routes = require('./routes')

class App {
    constructor() {
        this.express = express();
        this.handleMiddlewares();
        this.handleDatabase();
        this.handleRoutes();
        this.handleErrorMiddlewares();
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
}

module.exports = new App().express;