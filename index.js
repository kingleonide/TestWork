const express    = require('express');
const bodyParser = require('body-parser');
const validator  = require('validator');
const app        = express(); 


/* 
    Тут возникла проблема, которую я решить не смог.
    Когда мы создаем новый экземпляр Event/User, у нас так-же инициализируется класс Database.
    Т.е мы имеем 2 инстанса одного класса Database, а за ним 2 пула БД.
    Так-же было 2 инстанса класса Config, который стал JSON объектом, ибо смысла в классе не было
    Хотя в этом классе можно было отобразить использовании get/set.
    Я пытался решить проблему через глобальную проблему, но коннект само собой создавался только в одном спейсе
    Т.е в User классе, методы были доступны, но соеденения с бд не было.

    Мне в идеале нужно было чтобы Event был унаследован от Database, User
    Для того чтобы я мог проверить токен пользователя, данный метод реализован в классе User.
    Из-за этого всего, приходится выполнять проверку и обновления токенов не в классе Event, а прямо в роутах.
    По этому, оставляю 2 инстанса как есть, потому что решении проблемы я не нашёл.
*/

const Event      = new (require('./Event'));
const User       = new (require('./User'));


app.use(bodyParser.json());
app.disable('x-powered-by');



/* 
    /POST http://localhost/auth 
    headers
        content-type [application/json]
    body 
        {"login":"admin@gmail.com", "pass":"pass"} 
*/
app.post("/auth", function(req, res){
    let Userdata = {Login: req.body.login, Password: req.body.pass}
    User.User_Auth(Userdata, function(err, Token){
        if(err)
            return res.status(400).json(err)
        res.send(Token);
    }); 
})
/*
    Проверка токена возвращает три состояния.
    Token is ok
    Bad token
    Token expired
    
    Время жизни токена указано в конфиге, 10 минут.
*/
app.get('/checkToken731b1cd19a42415f83a9b76870178951', async function(req, res){
    let Token  = req.headers.token;
    let Result = await User.CheckToken(Token);
    
    if(Result.error){
        return res.status(400).json(Result);
    }

    res.json({"OK": "Token is ok"});
})



/* 
    /GET http://localhost/list 
    headers
        token        = securityToken from /auth
*/
app.get('/list', async function(req, res){
    let Token  = req.headers.token;
    let Result = await User.CheckToken(Token);
    
    if(Result.error){
        return res.status(400).json(Result);
    }

    Event.Event_List((events) => {
        res.send(events);
        User.UpdateToken(Token);
    }) 
})

/* 
    /POST http://localhost/create
    headers
        Content-Type = application/json
        token        = securityToken from /auth
    body 
        {"name": "TestEvent1", "start_date": "1", "end_date": 10000}
        {id: 1, "name": "TestEvent1", "start_date": "1", "end_date": 10000}
*/
app.post('/create', async function(req, res){
    let Token  = req.headers.token;
    let Result = await User.CheckToken(Token);

    if(Result.error){
        return res.status(400).json(Result);
    }

    let DATA = req.body;

    Event.Event_Create(DATA, (r) => {
        if(r.error)
            return res.status(400).json(r)
        res.json(r);
        User.UpdateToken(Token);
    });
})

/* 
    /PUT http://localhost/update/:id
    headers
        Content-Type = application/json
        token        = securityToken from /auth
    body 

        {id: 1, "name": "TestEvent1", "start_date": "1", "end_date": 10000}
        {"name": "TestEvent1", "start_date": "1", "end_date": 10000}
        {"start_date": "1", "end_date": 10000}
        {"end_date": 10000}
        {"name": "TestEvent1"}
        {"name": "TestEvent1", "start_date": "1"}
        {"name": "TestEvent1", "end_date": 10000}
        {id: 1, "start_date": "1", "end_date": 10000}
        {id: 1, "name": "TestEvent1", "1", "end_date": 10000}
        {id: 1, "name": "TestEvent1", "start_date": "1", "end_date": 10000}
        И другие вариации запросов

        Если данные для изменения будут идентичны тем данным которые есть в базе
        вернется сообщение содержащие в себе объект запроса и объект модификации если хотя бы 1 параметр изменился
        иначе 
        вернется сообщение содержащие в себе объект запроса 
        и в объекте модификации сообщение о том что объект не был модифицирован
*/

/* like CRUD with await*/
app.put('/update/:id', async function(req, res){
    let Token  = req.headers.token;
    let Result = await User.CheckToken(Token);

    if(Result.error){
        return res.status(400).json(Result);
    }

    let Id = req.params.id;
    let Data = req.body;
        
    Event.Event_Update(Id, Data, (Result) => {
        if(Result.error)
            return res.status(400).json(Result)
        console.log(Result);
        res.json(Result);
        User.UpdateToken(Token);
    });
})


/* like CRUD with await*/
/* 
    /GET http://localhost/getById/1
    /GET http://localhost/getById/2
    headers
        token        = securityToken from /auth
    
*/

/* 
    Easy way, если по хорошему. 
    app.get('/getById/:id', Event.getById) но теряется контекст, если не использовать анонимную функцию.
*/

app.get('/getById/:id', (req, res) => {Event.getById(req, res)})

// app.get('/getById/:id', async function(req, res){
//     let Token  = req.headers.token;
//     let Result = await User.User_CheckToken(Token);
    
//     if(Result.error){
//         return res.status(400).json(Result);
//     }

//     let id = req.params.id;

//     Event.Event_GetById(id)
//         .then(event => {
//             /* комментарий по данному решению дан в файле Database.js */
//             res.json(event);
//             User.User_UpdateToken(Token);
//         })
//         .catch(e => {
//             res.status(400).json(e);
//         })
// })


/* 
    URIError хак, работает даже без условия и escape, просто next() и это уже работает
    На всякий случай оставлю с проверкой инстанса.
*/
app.use(function(err, req, res, next) {
    if(err instanceof URIError)
        req.url = validator.escape(req.url);
    next();
});

app.listen(80, () => {
    console.log(`Server started on 80 port`);
});

