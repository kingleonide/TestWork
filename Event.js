const Database  = require('./Database');
const Validator = require('validator');

/* Best way https://habr.com/ru/post/222761/ */

/* 
    Этот файл по факту не несет в себе никакого смысла. 
    Всю эту обработку можно было сделать в мейне и я это понимаю.
    Ради Events extends Database решил поступить таким образом. 
*/



class Event extends Database{
    constructor(){
        super();
    }

    /* Какая либо фильтрация не требуется */
    Event_List(callback){ 
        return this.DB_List((events) => {
            for(let event of events.events)
                event.name = Validator.unescape(Validator.toString(event.name));
            return callback(events)
        });  
    }
    
    Event_Create(Data, callback){
        if(!Object.keys(Data).length)
            return callback({error: "Empty data"})

        let clean = Object();
        
        /* id, optionaly */
        if(typeof Data.id !== "undefined"){
            if(!Validator.isNumeric(Validator.toString(Data.id), {no_symbols: true}))
                return callback({error: "ID only number" })
            
            Data.id = Validator.toInt(Validator.toString(Data.id));
            if(isNaN(Data.id) || Data.id < 1 || Data.id > 2147483647)
                return callback({error: "Incorrect id param, min 0, max 2147483647"})
            clean.id = Data.id;   
        }

        /* name */
        Data.name = Validator.toString(Data.name)
        if(typeof Data.name === "undefined")
            return callback({error: "Empty event name" })

        if(!Validator.isLength(Data.name, {min: 0, max: undefined}))
            return callback({error: "Name length min 0" })
        
        clean.name = Validator.escape(Data.name);
         
        /* start_date */
        if(typeof Data.start_date === "undefined")
            return callback({error: "Empty start_date" })

        if(!Validator.isNumeric(Validator.toString(Data.start_date), {no_symbols: true}))
            return callback({error: "start_date only number" })
        
        Data.start_date = Data.start_date;
        if(isNaN(Data.start_date) ||Data.start_date < 0 || Data.start_date > 9223372036854775807)
        return callback({error: "Incorrect end_date, min 0, max 9223372036854775807"})
        clean.start_date = Validator.toInt(Validator.toString(Data.start_date));

        /* end_date */
        if(typeof Data.end_date === "undefined")
            return callback({error: "Empty end_date" })

        if(!Validator.isNumeric(Validator.toString(Data.end_date), {no_symbols: true}))
            return callback({error: "end_date only number" })
        
        Data.end_date = Data.end_date;
        if(isNaN(Data.end_date) ||Data.end_date < 0 || Data.end_date > 9223372036854775807)
            return callback({error: "Incorrect end_date, min 0, max 9223372036854775807"})
        clean.end_date = Validator.toInt(Validator.toString(Data.end_date));
        

        /* start_date & end_date */
        if(clean.start_date > clean.end_date)
            return callback({error: "start_date can not be less end_date"})

        super.DB_Create(clean, (data) => {
            data.created.name = Validator.unescape(data.created.name);
            return callback(data)
        })
    }

    Event_Update(Id, Data, callback){
        if(!Object.keys(Data).length)
            return callback({error: "Empty data"})

        let clean = Object();
        
        if(typeof Id !== "undefined"){
            if(!Validator.isNumeric(Validator.toString(Id), {no_symbols: true}))
                return callback({error: "ID only number" })
            
            Id = Validator.toInt(Validator.toString(Id));
            if(isNaN(Id) || Id < 1 || Id > 2147483647)
                return callback({error: "Incorrect id param, min 0, max 2147483647"})
        }


        /* id, optionaly */
        if(typeof Data.id !== "undefined"){
            if(!Validator.isNumeric(Validator.toString(Data.id), {no_symbols: true}))
                return callback({error: "Id in object for update only number" })
            
            Data.id = Validator.toInt(Validator.toString(Data.id));
            if(isNaN(Data.id) || Data.id < 1 || Data.id > 2147483647)
                return callback({error: "Incorrect id in object for update, min 0, max 2147483647"})
            clean.id = Data.id;   
        }

        /* name */
        Data.name = Validator.toString(Data.name)
        if(!Validator.isEmpty(Data.name)){
            if(!Validator.isLength(Data.name, {min: 0, max: undefined}))
                return callback({error: "Name length min 0" })
            
            clean.name = Validator.escape(Data.name);
        }
         
        /* start_date */
        if(!Validator.isEmpty(Validator.toString(Data.start_date))){
            if(!Validator.isNumeric(Validator.toString(Data.start_date), {no_symbols: true}))
                return callback({error: "start_date only number" })
        
            Data.start_date = Data.start_date;
            if(isNaN(Data.start_date) ||Data.start_date < 0 || Data.start_date > 9223372036854775807)
            return callback({error: "Incorrect end_date, min 0, max 9223372036854775807"})
            clean.start_date = Validator.toInt(Validator.toString(Data.start_date));
        }

        /* end_date */
        if(!Validator.isEmpty(Validator.toString(Data.end_date))){
            if(!Validator.isNumeric(Validator.toString(Data.end_date), {no_symbols: true}))
                return callback({error: "end_date only number" })
            
            Data.end_date = Data.end_date;
            if(isNaN(Data.end_date) ||Data.end_date < 0 || Data.end_date > 9223372036854775807)
                return callback({error: "Incorrect end_date, min 0, max 9223372036854775807"})
            clean.end_date = Validator.toInt(Validator.toString(Data.end_date));
        }
        
        /* start_date & end_date */
        if(clean.start_date > clean.end_date)
            return callback({error: "start_date can not be less end_date"})

        super.DB_Update(Id, clean, (err, data) => {
            if(err)
                return callback(err)
            console.log(data);
            if(typeof data.select.name !== "undefined")
                data.select.name = Validator.unescape(data.select.name);
            if(typeof data.modify.name !== "undefined")
                data.modify.name = Validator.unescape(data.modify.name);
            return callback(data)
        })
    }

    /* async with throw */
    async getById(req, res, next){
        let Id = req.params.id;
        if(typeof Id === "undefined"){
            return res.status(400).json({error: "Id is empty"}) 
        }else if(!Validator.isNumeric(Validator.toString(Id), {no_symbols: true})){
            return res.status(400).json({error: "Id not numeric"});
        }else if(Validator.toInt(Id) < 1 || Validator.toInt(Id) > 2147483647){
            return res.status(400).json({error: "Incorect id, min 0, max 2147483647"});
        }

        let Token  = Validator.escape(Validator.toString(req.headers.token));
        if(typeof Token === "undefined" || Validator.isEmpty(Token))
            return res.status(400).json({error: "Empty Token"})

        let TokenResult = await this.DB_CheckToken(Token)
        if(TokenResult.error)
            return res.status(400).json(TokenResult)
        
        this.DB_UpdateToken(Token);
        

        let GetResult = await this.DB_GetById(Id)
        if(GetResult.error)
            return res.status(400).json(TokenResult)
        GetResult.event.name = Validator.unescape(GetResult.event.name)
        res.json(GetResult)                    
    }
}

//async Event_GetById(id){
//     console.log(req, res)
//     return;
//     /* 
//         Можно было сделать так, но в эскейпе смысла нет, 
//         toInt ломает любые символы Приводя к NaN
//         id = Validator.toInt(Validator.escape(id)); 

//         Можно так-же привести к Number()
//         parseInt()
//     */
    

//     id = Validator.toInt(id)
//     if(isNaN(id) || id < 1 || id > 2147483647)
//         throw({error: "Incorrect id param"});
    
//     /*
//         http://localhost/getById/©
//         http://localhost/getById/-1
//         http://localhost/getById/0
//         http://localhost/getById/s
//         http://localhost/getById/""
//         http://localhost/getById/' UNION SELECT
        
//         http://localhost/getById/2147483647 (INT_MAX), выплюнет вне диапазона для типа integer, ибо тип Id = Integer.
//         http://localhost/getById/%   = Крашит роут, проблема решена хаком.
//         http://localhost/getById/1.9999999 выполнится как ID = 1 из-за toInt
//     */
                        
//     let result = await this.DB_GetById(id)

//     if(result.error)   
//         throw(result.error)
//     result.event.name = Validator.unescape(result.event.name);
//     return result; 
// }
// }

module.exports = Event;