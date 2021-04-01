const { info, debug } = require('console');
const { query } = require('express');
const express = require('express');
const path = require('path'); 
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');
const socketPath = process.env.socketPath || 'http://localhost:8000';
const peerPath = process.env.peerPath || 'http://localhost:9000'

const socketProxy = createProxyMiddleware('/rtpc', {
    target: socketPath,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
});

const peerProxy = createProxyMiddleware('/peer', {
    target: peerPath,
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
})

app.use(express.static(__dirname + '/Client_Side'));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

app.use(socketProxy);

app.use(peerProxy);

app.get('/', (req, res) =>{
    console.log('-----x----------x----------x-----');
    console.info("REQUEST : GET ;; ROUTE : '/'");
    res.sendFile(__dirname + '/home.html');
});

app.get('/viewer', (req, res) => {
    console.log('-----x----------x----------x-----');
    console.info("REQUEST : GET ;; ROUTE : '/viewer'");
    res.sendFile(__dirname + '/viewer.html');
});




const server = app.listen(3000, () =>{
    console.log('Server Listening on Port 3000');
});
server.on('upgrade', socketProxy.upgrade); // optional: upgrade externally
server.on('upgrade', peerProxy.upgrade);

