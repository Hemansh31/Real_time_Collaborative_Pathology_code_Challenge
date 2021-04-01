const fs = require('fs');
const PeerServer = require('peer').PeerServer;

const server = PeerServer({
    port: 9000,
    path: '/peer',
    proxied: true
});

console.log('Server is running');