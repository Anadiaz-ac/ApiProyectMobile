const mysql = require('mysql2/promise');
// import { config } from '../config.js';

const conn = {};

var connDB = {}

conn.getConnection = async() => {

    // const connection = mysql.createConnection({
    //     host: config.dbHost,
    //     user: config.dbUser,
    //     password: config.dbPassword,
    //     database: config.dbName,
    //     port: config.dbPort
    // })

    connDB = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'db_brokers',
        port: '3306'
    })


}

conn.aQuery = async(query) =>{
  
    if (query != "") {
        try {
            const result = await connDB.query(query);
            return {"err": null, "result": result[0]};
        } catch (error) {
            console.log("QUERY ERROR: ", error);
            return {"err": error, "result": []};
        }        
    }

    return {"err": "Query vacía", "result": []}
}

module.exports = conn