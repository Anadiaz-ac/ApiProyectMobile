const mysql = require('../database/database.js');
let controller = {}

mysql.getConnection();

controller.validateUser = async (req, res) => {
    let data = req.body;
    if (data.email && data.email.length > 0 && data.password && data.password.length > 0) {
        let query = `SELECT * FROM users WHERE email = '${data.email.trim()}' AND password = '${data.email.trim()}'`;  
        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        if (result[0].length > 0) {
            let dataUser = await getComplementUser(result[0])
            res.send({"success": true, "user": dataUser} ) 
        }
        else{
            return res.send({"success": false, "error": "Usuario o Contraseña Incorrectos"} )
        }            
    }
    else{
        res.send({"success": false, "error": "Datos Incorrectos"} )
    }
}

const getComplementUser = async(user) =>{

    let query = `
    SELECT u.id, u.name AS nombre, u.balance AS saldo, c.description AS pais, c.id AS id_pais, u.email AS correo
    FROM users u
    LEFT JOIN country c ON c.id = u.country_origin
    WHERE u.id = ${user[0].id}`;  
    
    let {err, result} = await mysql.aQuery(query)  
    if (err) { return {} }
    if (result.length == 0) {  return {} }
    return result[0]
}

controller.createUser = async (req, res) => {
    let data = req.body;
    console.log(data);
    if (data.email && data.email.length > 0 && data.password && data.password.length > 0 && data.name && data.name.length > 0) {
        let query = `
        INSERT INTO users (name, country_origin, balance, email, password)
        VALUES ('${data.name.trim()}', ${data.country_origin || 1}, ${data.balance || 0}, '${data.email.trim()}', '${data.password.trim()}')`;  

        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        res.send({"success": true, "msg": "Usuario Creado con exito"} )          
    }
    else{
        res.send({"success": false, "error": "Datos Incorrectos"} )
    }
}

controller.getCountries = async (req, res) => {

    let query = `SELECT * FROM country`;  
    let {err, result} = await mysql.aQuery(query)   
    let query2 = `SELECT * FROM country_coins`;  
    let {err2, result2} = await mysql.aQuery(query2)   
    if (err || err2) { return res.send({"success": false, "error": err} || err2 )}
   
    let countries = result
    let coins = result2
    let dataSend = []
    for (let i = 0; i < countries.length; i++) {
        let coin_filter = coins.filter(e => e.id_country == countries[i].id)
        dataSend.push({
            "id": countries[i].id,
            "pais": countries[i].description,
            "monedas": coin_filter,
        })
    }
    res.send({"success": true, "paises": dataSend} )          
}



controller.buy = async (req, res) => {
    let data = req.body;
    console.log(data);
    if (data.email && data.email.length > 0 && data.password && data.password.length > 0 && data.name && data.name.length > 0) {
        let query = `
        INSERT INTO user_history (id_user, id_country, action, coin_action, date)
        VALUES ('${data.name.trim()}', ${data.country_origin || 1}, ${data.balance || 0}, '${data.email.trim()}', '${data.password.trim()}')`;  

        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        res.send({"success": true, "msg": "Usuario Creado con exito"} )          
    }
}


module.exports = controller