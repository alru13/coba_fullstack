const mysql = require('mysql')

const db = mysql.createConnection({
    host: "localhost", 
    user: "root", 
    password: "", 
    database: "projek1"
})

module.exports = db