const Database = require('./Database');
const validator = require('validator');

class User extends Database{
    User_Auth(Userdata, callback){
        if(typeof Userdata.Login === "undefined" || validator.isEmpty(Userdata.Login))
            return callback({error: "Empty Login"})
        
        if(!validator.isEmail(Userdata.Login))
            return callback({error: "Bad e-mail address"})

        if(typeof Userdata.Password === "undefined" || validator.isEmpty(Userdata.Login))
            return callback({error: "Empty Password"})

        if(!validator.isLength(Userdata.Password, 4, 32))
            return callback({error: "Bad password length, min 4, max 32"})

        /* при регистрации нужно эскейпить */
        Userdata.Login    = validator.escape(Userdata.Login)
        Userdata.Password = validator.escape(Userdata.Password)

        this.DB_Auth(Userdata, (err, data) => {
            callback(err, data)
        });
    }

    /* Async */
    async CheckToken(Token){
        if(typeof Token === "undefined" || validator.isEmpty(Token) )
            return {error: "Empty token"}
    
        Token = validator.escape(Token)
        
        return await this.DB_CheckToken(Token).catch(e => { return e});
    }

    UpdateToken(Token){
        this.DB_UpdateToken(Token)
    }

    Register(){
        /* PASS */ 
    }
}

module.exports = User;