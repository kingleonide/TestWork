// class Config{
//     constructor(){
//         this.DB_user     = 'NIP';
//         this.DB_host     = 'localhost';
//         this.DB_database = 'postgres';
//         this.DB_password = 'root';
//         this.DB_port     = 5432;

//         this.prefix_salt           = "EVU3yZNKHp" 
//         this.postfix_salt          = "Y0QudNjYJ6" 
        
//         this.tokenTimeAlive = 10;

//         this.serverPort = 80;
//         this.DEBUG      = true;
            
//     }
// }

const Config = {
    DB_user: 'NIP',
    DB_host: 'localhost',
    DB_database: 'postgres',
    DB_password: 'root',
    DB_port: 5432,

    prefix_salt: "EVU3yZNKHp",
    postfix_salt: "Y0QudNjYJ6",
    
    tokenTimeAlive: 600,

    serverPort: 80,
    Debug: true,
}

module.exports = Config;





