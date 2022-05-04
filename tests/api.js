const axios = require('axios')

const api = axios.create({
  baseURL: 'http://localhost:80', // this is localhost (telenews)
  headers: {
    'Access-Control-Allow-Origin': '*',
    Connection: 'keep-alive',
  }
})

module.exports = api
