const mysql = require('../database/database.js');
const moment = require('moment');
let controller = {}

mysql.getConnection();

controller.validateUser = async (req, res) => {
    let data = req.body;

    if (data.correo && data.correo.toString().trim()!="" && data.clave && data.clave.toString().trim()!="") {
        let query = `SELECT * FROM users WHERE email = '${data.correo.trim()}' AND password = '${data.clave.trim()}'`;  
        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        if (result.length > 0) {
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
    WHERE u.id = ${user.id}`;  
    
    let {err, result} = await mysql.aQuery(query)  
    if (err) { return {} }
    if (result.length == 0) {  return {} }
    let coins = await getCountryUser(result[0].id_pais)
    let history = await getHistoryUser(result[0].id)
    result[0].coins = coins
    result[0].history = history
    result[0].totalCoin = []
    let groupCoins = groupBy(history, 'nombre_moneda');

    for (const coin in groupCoins) {
        let total = 0
        for (let j = 0; j < groupCoins[coin].length; j++) {
            if (groupCoins[coin][j].id_accion == "1") {
                total = total + groupCoins[coin][j].valor_accion
            }
            else{
                total = total - groupCoins[coin][j].valor_accion
            }
        }
        result[0].totalCoin.push({
            "nombre_moneda": coin,
            "id_moneda": groupCoins[coin][0].id_moneda,
            "cantidad": total
        })     
    }
    console.log(groupCoins);
  
    return result[0]
}

const groupBy = (arr, key) => {
    return arr.reduce((acc, item) => {
        const keyValue = item[key];
        if (!acc[keyValue]) {
            acc[keyValue] = [];
        }
        acc[keyValue].push(item);
        return acc;
    }, {});
};

controller.createUser = async (req, res) => {
    let data = req.body;
   
    if (data.correo && data.correo.toString().trim()!="" && data.clave && data.clave.toString().trim()!="" && data.nombre && data.nombre.toString().trim()!="") {
        let query = `
        INSERT INTO users (name, country_origin, balance, email, password)
        VALUES ('${data.nombre.trim()}', ${data.pais || 1}, ${data.saldo || 0}, '${data.correo.trim()}', '${data.clave.trim()}')`;  

        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        res.send({"success": true, "msg": "Usuario Creado con exito"} )          
    }
    else{
        res.send({"success": false, "error": "Datos Incorrectos"} )
    }
}

const getCountryUser = async (id_country) => {

    let query = `SELECT * FROM country_coins WHERE id_country = ${id_country}`;  
    let {err, result} = await mysql.aQuery(query)   
    if (err) { return []}
    return result    
}


const getHistoryUser = async (id_user) => {

    let query = `
    SELECT u.id, u.id_country AS id_pais, u.action AS id_accion, 
    CASE
        WHEN u.action = 1 THEN "Compra"
        ELSE "Venta"
    END descripcion_accion, u.amount_coin AS valor_accion, u.id_coin_action AS id_moneda, cc.description AS nombre_moneda, date AS fecha_accion 
    FROM user_history u 
    LEFT JOIN country_coins cc ON cc.id = u.id_coin_action 
    WHERE id_user = ${id_user}`;  

    let {err, result} = await mysql.aQuery(query)   
    if (err) { return []}
    return result    

}


controller.getCountries = async (req, res) => {

    let query = `SELECT id AS id_pais, description AS nombre_pais, code as codigo_pais FROM country`;  
    let {err, result} = await mysql.aQuery(query)   
    if (err) { res.send({"success": false, "error": err, "data": []} )}
    res.send({"success": true, "error": "", "data": result} )
}


controller.buy = async (req, res) => {
    let data = req.body;
   
    if (data.id_moneda && data.id_moneda.toString().trim()!="" && data.id_usuario && data.id_usuario.toString().trim()!="") {
        let date = moment().format("YYYY-MM-DD HH:mm:ss")
        let query = `
        INSERT INTO user_history (id_user, id_country, action, amount_coin, id_coin_action, date)
        VALUES (${data.id_usuario}, ${data.id_pais || 1}, 1, ${data.cantidad}, ${data.id_moneda}, '${date}')`;  

        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        let newBalance = await updateBalanceUser(1, data.id_usuario, data.cantidad, data.id_moneda)
        return res.send({"success": true, "msg": "", "balance": newBalance} )          
    }
    return res.send({"success": false, "error": "Datos Incorrectos"} ) 
}

controller.sell = async (req, res) => {
    let data = req.body;
 
    if (data.id_moneda && data.id_moneda.toString().trim()!="" && data.id_usuario && data.id_usuario.toString().trim()!="") {
        let date = moment().format("YYYY-MM-DD HH:mm:ss")
        let query = `
        INSERT INTO user_history (id_user, id_country, action, amount_coin, id_coin_action, date)
        VALUES (${data.id_usuario}, ${data.id_pais || 1}, 2, ${data.cantidad}, ${data.id_moneda}, '${date}')`;  

        let {err, result} = await mysql.aQuery(query)   
        if (err) { return res.send({"success": false, "error": err} )}
        let newBalance = await updateBalanceUser(2, data.id_usuario, data.cantidad, data.id_moneda)
        return res.send({"success": true, "error": "", "balance": newBalance} )          
    }
    return res.send({"success": false, "error": "Datos Incorrectos"} )    
}

const updateBalanceUser = async(type, id_user, amount, id_coin) => {

    let balance = await getBalanceUser(id_user)
    balance = Number(balance)
    let price = await getEquivalentPrice(id_coin)
    let total = Number(price) * Number(amount)

    if (balance > 0 && balance >= total) {
        let newBalance = 0 
        if (type == 1) {
            newBalance = balance - total
        }
        else{
            newBalance = balance + total
        }
      
        let query = `
            UPDATE users 
            SET balance = ${newBalance}
            WHERE id = ${id_user} `;

        let {err, result} = await mysql.aQuery(query)  
        if (err) { return balance }
        return newBalance
    }
}


const getBalanceUser = async(id_user) => {

    let query = `
        SELECT balance
        FROM users 
        WHERE id = ${id_user}`;  
    
    let {err, result} = await mysql.aQuery(query)  
    if (err) { return 0 }
    if (result.length == 0) { return 0 }
    return result[0].balance

}

const getEquivalentPrice = async(id_coin) => {

    let query = `
        SELECT price_equivalent
        FROM country_coins 
        WHERE id = ${id_coin}`;  
    
    let {err, result} = await mysql.aQuery(query)  
    if (err) { return 0 }
    if (result.length == 0) { return 0 }
    return result[0].price_equivalent

}


module.exports = controller