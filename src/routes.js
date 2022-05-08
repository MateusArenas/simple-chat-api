const path = require('path')
const { Router } = require('express')

const routes = Router()

const folder = "./routers";
require("fs").readdirSync(path.join(__dirname, folder)).forEach((file) => {
    const controller = require(path.join(__dirname, folder, file));

    Object.keys(controller).forEach(type => { 
        const method = type.toLowerCase();

        Object.keys(controller[type]).forEach(path => {
            routes[method](path, controller[type][path])
        })
    })
});

module.exports = routes