const { Pool } = require('pg');
const Config          = require('./Config');
const crypto          = require('crypto');
const uuid            = require('uuid/v4');

class Database {
    constructor(){
        /* Environment variables */
        /* Connection with URI */
    
        this.pool = new Pool({ 
            user: Config.DB_user,
            host: Config.DB_host,
            database: Config.DB_database,
            password: Config.DB_password,
            port: Config.DB_port,
        })

        this.pool.on('error', e =>{
            if(Config.Debug) console.log("Pool on error", e);
        })

        if(Config.Debug) console.log("DB init.")     
    }


    /* pg.pool */
    DB_Auth(User, callback){
        /* https://habr.com/ru/company/acribia/blog/413157/ */
        let hashedPassword = crypto.createHash('md5').update(Config.prefix_salt + User.Password + Config.postfix_salt).digest("hex");
        let query = `SELECT * FROM public.users WHERE username = '${User.Login}' AND password = '${hashedPassword}'`;
        
        // this.pool.connect((err, client, release) => {
        //     if(err){
        //         console.error('Error acquiring client', err.stack)
        //         /* 
        //             Теоретически выплюнет тогда, когда база уйдет на перекур 
        //             С другой же стороны если посмотреть, в некоторых случаях приложение вообще не должно отвечать на запросы 
        //             Т.е при старте приложения, должен выполнится коннект к базе и если она ответила на запрос то запустить сервер экспресса
        //             Если же же от базы ответа нет, то должны быть другие развития события такие как
        //                 Попытка реконнекта через 5-10 секунд на протяжении 5-и попыток, с соответсвующим дебаг-логом
        //                 Приложение не запустится, выплюнув программисту соответствующую ошибку.
        //         */
        //         return callback({error: "Internal error"})
        //     }
        //     client.query(query, (err, res) => {
        //         release();
        //         if (err) {
        //             console.log("CheckUserCredentials", err.stack)
        //             /* По сути, return тут не нужен так как кода дальше нет, но все же, на всякий случай*/
        //             return callback({error: "Internal error"});
        //         } else {
        //             if(res.rows.length > 0){
        //                 let User = res.rows[0];
        //                 this.UpdateUserToken(User, (token) =>{
        //                     callback(null, token);
        //                 })
        //             }else{
        //                 callback({error: "Auth error"});
        //             }
        //         }
        //     }) 
        // })
        this.pool.query(query, (err, res) => {
        
            if (err) {
                if(Config.Debug) console.log("CheckUserCredentials", err.stack)
                /* По сути, return тут не нужен так как кода дальше нет, но все же, на всякий случай*/
                return callback({error: "Internal error"});
            } else {
                if(res.rowCount > 0){
                    let User = res.rows[0];
                    this.DB_UpdateToken(User, (token) =>{
                        return callback(null, token);
                    })
                }else{
                    return callback({error: "Auth error"});
                }
            }
        }) 
    }

    /* pg.client */
    DB_UpdateToken(User, callback){
        /* 
        По спецификации JS, getTime() возвращает время в миллисекундах
        по этому приходится делить на 1000 с последующим округлением 

        Можно поступить еще так.
            let TokenExpire = +new Date();
            let TokenExpire =  new Date().getTime() / 1000 | 0
        */
        
        let TokenExpire = Math.round(new Date().getTime() / 1000) + Config.tokenTimeAlive;

        /* 
            Так-же не понятен такой нюанс как Pool/Client
            Дело в том что Pool рекомендуют использовать тогда, когда есть большой поток соединений
            В противном случае используем Client, но и тут нюанс, в спешке не нашёл конкретного ответа
            Может ли pg держать соединие постоянным, т.е я в теории мог объявить в конструкторе соединение
            this.client.connect();
            и обращаться так, this.client.query(...)

            Это была раняя версия, но из-за отсуствия понимания как конкретно работает client.connect()
            Т.е была такая дилема, постоянный коннект в конструкторе и последующее использование client.query()
            либо
            в каждом методе каждый раз использовать connect() и query()

            В текущей документации описано что можно использовать первый вариант, ну это как я понял.
                const client = new Client({
                    user: 'dbuser',
                    host: 'database.server.com',
                    database: 'mydb',
                    password: 'secretpassword',
                    port: 3211,
                })
                client.connect()

                client.query('SELECT NOW()', (err, res) => {
                    console.log(err, res)
                    client.end()
                })
            
            Опять же вопрос, после запроса мы закрываем коннект, т.е получается так что в соседнем методе
            нужно опять открывать соединение, в общем я пошел по легкому для меня пути и переписал всё на pool.
            С другой стороны такая же история происходит с pool, т.е в документации примеров как таковых там мало
            
            https://node-postgres.com/api/pool
            В моем случае, вроде как мне не нужно делать постоянный connect
            В методе *CheckUserCredentials* оставил код для примера.
            Мне не понятно нужно ли при каждом запросе делать .connect или нет.
        */
        
        /* Использование встроенной в PG интерполяции ($1::TYPE) */
        let UserToken;
        if(User.id){ 
            UserToken = uuid(`${User.id}`);
            this.pool.query(`UPDATE public.users SET token = $1::text, expire = $2::numeric WHERE id = $3::numeric RETURNING token, expire`, [UserToken, TokenExpire, User.id], (err, res) => {
                if (err) {
                    console.log("UpdateUserToken", err.stack)
                    callback({error: "Internal error"});
                } else {
                    callback({token: UserToken});
                }
            })
        }else{
            UserToken = User
            this.pool.query(`UPDATE public.users SET expire = $1::numeric WHERE token = $2::text RETURNING token, expire`, [TokenExpire, UserToken], (err, res) => {
                if (err) {
                    console.log("UpdateUserToken", err.stack)
                }
            })
        }
        
    }
    /* Асинхронная проверка токена пользователя */
    async DB_CheckToken(UserToken){
        let query = `SELECT token, expire FROM public.users WHERE token = '${UserToken}'`

        return await this.pool.query(query).then((res) => {
            if(res.rowCount > 0){
                let expire = res.rows[0].expire;
                let curTime = Math.round(new Date().getTime() / 1000);
                if(curTime > Number(expire))
                    return {error: "Token has expired"}
                return true;
            }
            return {error: "Bad token"};
        })
        .catch(e => {
            if(Config.Debug) console.log(e);
            return {error: "Internal error"}
        })
    }

    DB_List(callback){
        let query = `SELECT id::int, name, start_date::int, end_date::int FROM public.events`
        if(Config.Debug) console.log(query);
        this.pool.query(query, (err, res) => {
            if(err){
                if(Config.Debug) console.log("GetAllEvents:Error", err)
                return callback({error: "Internal error"});
            }else{
                callback({events: res.rows})
            }
        })
    }
    
    /* Callback */
    DB_Create(Data, callback){
        let query = `INSERT INTO public.events (name, start_date, end_date) VALUES ('${Data.name}', '${Data.start_date}', '${Data.end_date}') RETURNING id::int, name, start_date::int, end_date::int`
        if(Data.id)
            query = `INSERT INTO public.events (id, name, start_date, end_date) VALUES ('${Data.id}', '${Data.name}', '${Data.start_date}', '${Data.end_date}') RETURNING id::int, name, start_date::int, end_date::int`
        
        if(Config.Debug) console.debug(query);

        this.pool.query(query, (err, res) => {
            if(err){
                if(Config.Debug) console.log(err)
                return callback({error: "Internal error"});                
            }else{  
                return callback({created: res.rows[0]})
            }
        })
    }

    /* Callback */
    
    DB_Update(Id, Data, callback){
        let query = `SELECT id::int, name, start_date::int, end_date::int FROM public.events WHERE id = '${Id}'`    
        
        this.pool.query(query, (err, res) => {
            if(err){
                if(Config.Debug) console.log(err)
                return callback({error: `Internal error`})
            }else{  
                if(res.rowCount < 1)
                    return callback({error: `event from id ${Id} not found.`})

                let result = res.rows[0];
                        
                if(typeof Data.id !== "undefined"){
                    Data.id = Data.id !== result.id ? Data.id : result.id;
                }else{
                    Data.id = result.id 
                }

                if(typeof Data.name !== "undefined"){
                    Data.name = Data.name !== result.name ? Data.name : result.name;
                }else{
                    Data.name = result.name 
                }
                
                if(typeof Data.start_date !== "undefined"){
                    Data.start_date = Data.start_date !== result.start_date ? Data.start_date : result.start_date;
                }else{
                    Data.start_date = result.start_date 
                }

                if(typeof Data.end_date !== "undefined"){
                    Data.end_date = Data.end_date !== result.end_date ? Data.end_date : result.end_date;
                }else{
                    Data.end_date = result.end_date 
                }

                if(Data.start_date > Data.end_date)
                    return callback({error: "start_date can not be less end_date"})
                
                if(Data.id == result.id && Data.name == result.name && Data.start_date == result.start_date && Data.end_date   == result.end_date)
                    return callback(null, {select: result, modify: "not modifyed, data is equal"})

                Data.name       = Data.name       !== result.name       ? Data.name       : result.name;
                Data.start_date = Data.start_date !== result.start_date ? Data.start_date : result.start_date;
                Data.end_date   = Data.end_date   !== result.end_date   ? Data.end_date   : result.end_date;

                let query = `UPDATE public.events SET id = '${Data.id}', name = '${Data.name}', start_date = '${Data.start_date}', end_date = '${Data.end_date}' WHERE id = '${Id}' RETURNING id::int, name, start_date::int, end_date::int`
        
                if(Config.Debug) console.debug(query);
        
                this.pool.query(query, (err, res) => {
                    if(err){
                        if(Config.Debug) console.log(err)
                    }else{  
                        callback(null, {select: result, modify: res.rows[0]})
                    }
                })
            }
        })

        
    }

    /* Async with throw, then/catch */
    async DB_GetById(Id, callback){
        let query = `SELECT id::int, name, start_date::int, end_date::int FROM public.events WHERE id = '${Id}';`
        
        if(Config.Debug) console.debug(query);

        return await this.pool.query(query)
            .then((res) => {
                if(res.rowCount > 0){
                    return {event: res.rows[0]}
                }
                /* 
                    Из-за того что сам создал себе проблему в виде файла Events.js
                    Мне теперь проблемно правильно вызвать throw в этом контексте, чтобы тот в своем случае вернулся в мейн
                    И сообщил пользователю о том, что эвент с таким айди не был найден
                    
                    throw("Event not found")
                    
                    Потому что .catch ниже ловит этот throw и я не могу его передать дальше.
                    Точнее выразиться я могу его передать, но суть в том что это файл обертка над базой
                    и мне не хотелось бы отдавать юзеру истинную ошибку от базы, ошибку конечно трудно получить
                    НО я мог упустить некоторые детали и опытный человек вероятно мог бы ее вызвать и наделать каких нибудь бед
                    Я проводил разного рода SQL Инъекции ради эксперимента, всё было вполне успешно примерно таким запросом
                    SELECT * FROM public.events WHERE id = '1[' UNION SELECT username | password, id, id, id FROM public.users;']
                    В данном контексте такой запрос фильтруется путём проверки на целочисленный тип
                    В валидаторе в данном случае смысла мало, но ради приличия привёл через него к инту, можно было привести через Number()
                    Так-же после этого можно было обращаться к id так /getById/1.01, запросы был бы вполне корректный
                    Проверка IsNan решает данную проблему.

                    По поводу текущего метода, из-за всего этого усложнения получаем то, что я могу передать СВОЙ throw
                    только проверив в .catch свойства переменной (e), поискать там то, что относится к базе, 
                    пример. 
                        if(e.code)
                            throw("Internal error");
                        throw(e);
                            
                    code содержится в сообщении от базы и по факту уникальное свойство
                    которое пользователю показывать не стоит, но код выше показался мне костылём.
                    
                    В идеале хотелось бы некую систему чтобы res.send принимал на вход объект с 2-умя свойствами.
                        {statusCode:400, statusMessage: "Simple error"}
                    Можно было бы переопределить метод res.send но я крайне не хочу этого делать, считаю это не правильным
                    На это нам даны мидлвары, но проблема в том что я не особо понял очередность исполнения, потрейсил исполнение очередности мидлвары
                    Получается так что моя мидлвара исполняется раньше чем res.send, мне это не подходит а в идеале хотелось бы
                    сделать так чтобы res.send / res.json или мидлвара умели обрабатывать res
                    и в случае если там лежит объект с моими полями, я мог бы генерировать заранее правильный ответ вида
                    res.status(obj.statusCode).json(obj.statusMessage) > 
                    res.status(400).json("SimpleError")

                    Поэтому костылю его обычным возратом объекта с обработкой в Event и index.js.
                */
                return {error: `Event by id ${Id} not found.`}
            })
            .catch(e => {
                if(Config.Debug) console.log(e);
                throw("Internal error");
            })
    }
}

module.exports = Database;


/* IF Performance */ 
/*
    const { performance } = require('perf_hooks');
    let time = 0;

    time = performance.now()
    for(let i = 0; i < 1000; i++)
        if(this.Debug) console.log(query);
    console.log(performance.now() - time)
    // 1 iteration     = 1.8492379784584045
    // 100 iterations  = 753.2363960146904
    // 1000 iterations = 5337.832567036152

    time = performance.now()
    for(let i = 0; i < 1000; i++)
        this.Debug && console.log(query); 
    console.log(performance.now() - time)
    // 1 iteration     = 1.2110549807548523
    // 100 iterations  = 509.9445009827614
    // 1000 iterations = 6185.453370988369

    time = performance.now()
    for(let i = 0; i < 1000; i++)
        this.Debug ? console.log(query) : void(0); 
    console.log(performance.now() - time)
    // 1 iteration     = 1.2559189796447754
    // 100 iterations  = 452.10597705841064
    // 1000 iterations = 4917.030879020691
*/