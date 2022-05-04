const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const routes = require('./routes')

class App {
    constructor() {
        this.express = express();
        this.handleMiddlewares();
        this.handleDatabase();
        this.handleRoutes();
    }

    handleMiddlewares() {
        this.express.use(express.json());
        this.express.use(express.urlencoded({ extended: true }));
        this.express.use(cors());
    }

    handleDatabase() {
        mongoose.connect('mongodb://localhost:27017/simple-chat?retryWrites=true&w=majority', {
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