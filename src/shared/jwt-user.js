const Errors = require('./errors');

class JwtUser {
    constructor(httpEvent) {
        if (!httpEvent || !httpEvent.headers || !httpEvent.headers['Authorization']) {
            console.info('Authorization header is missing from the request');
            throw Errors.MISSING_AUTHORIZATION;
        }
        
        let authHeader = httpEvent.headers['Authorization'];
        
        if (!authHeader.startsWith('Bearer')) {
            console.info('Auth scheme is not Bearer');
            throw Errors.MISSING_AUTHORIZATION;
        }
        
        let splitResult = authHeader.trim().split(' ');
        if (splitResult.length != 2) {
            console.info('Access token is missing.')
            throw Errors.MISSING_AUTHORIZATION;
        }
        
        this.jwt = splitResult[1];
        
        this.jwt = authHeader;
        this.parseJwt();
    }
    
    parseJwt() {
        console.info('Parsing user data');
        try {
        let userData = this.jwt.split('.')[1];
        let buffer = Buffer.from(userData, 'base64');
        let json = buffer.toString('utf8');
        let user = JSON.parse(json);

        this.userId = user.sub;
        this.username = user.username;
        this.clientId = user.client_id;
        this.scopes = user.scope.split(' ');
        } catch(err) {
            throw Errors.MISSING_AUTHORIZATION;
        }
        console.info('Username and userId parsed out.');
    }
}

module.exports = JwtUser;