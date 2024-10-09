const { PrismaClient } = require('@prisma/client')
const express = require('express')
const bodyParser = require('body-parser')
const db = require("./connection")
const response = require("./response")
const bcript = require('bcrypt')
const jwt = require('jsonwebtoken')
const cors = require('cors')

const prisma = new PrismaClient()
const port = 3000
const app = express()

app.use(bodyParser.json())
app.use(cors())

db.connect((err) => {
    if (err) throw err
    console.log('Database Connected!')
})

// DALAM PENGGUNAAN THUNDER CLIENT : JANGAN LUPA MENGGANTI METHOD YANG AKAN DIGUNAKAN!!!!!!!!!!!
// routes / URL / endpoint utama kita dengan method GET

const accessValidation = ( req, res, next) => {
    const {authorization} = req.headers

    if(!authorization) {
        return response(401, "error", "Token needed", res)
    }

    const token = authorization.split(' ')[1]
    const secret = process.env.JWT_SECRET

    try {
        const jwtDecode = jwt.verify(token, secret)

        req.userData = jwtDecode
    } catch (error) {
        return response(401, "error", "Unauthorized", res)
    }
    next()
}


// REGISTER
app.use('/api/v1/admin/register', accessValidation, async (req, res) => {
    const { username, password, email } = req.body

    const hashedPassword = await bcript.hash(password, 10) 
    const result = await prisma.admin.create({
        data: {
            username: username,
            password: hashedPassword,
            email: email
        }
    })
    res.json({message : `Admin user created`})
})

// LOGIN
app.use('/api/v1/admin/login', accessValidation, async (req, res) => {
    const { email, username, password } = req.body

    const admin = await prisma.admin.findUnique({
        where: {
            email: email,
            username: username
        }
    })

    if(!admin) {
        return response(404, 'error', "Admin user not found", res)
    }

    if(!admin.password) {
        return response(404, 'error', "Password not set", res)
    }

    const isPasswordValid = await bcript.compare(password, admin.password)

    if(isPasswordValid) {
        const payload = {
            id: admin.id,
            username: admin.username,
            email: admin.email
        }

        const secret = process.env.JWT_SECRET

        const expiresIn = 60 * 60 * 1

        const token = jwt.sign(payload, secret, {expiresIn: expiresIn})
       
        return res.json({
            data: {
                id: admin.id,
                username: admin.username,
                email: admin.email
            },
            token: token
        })
    } else {
        return response(403, "error", "Wrong password", res)
    }
})

// CREATE
app.post('/api/v1/admin', accessValidation, async (req, res, next) => {
    const { username, password, email } = req.body

    const result = await prisma.admin.create({
        data : {
            username: username,
            password: password,
            email: email
        }
    })
    res.json({
        data: result,
        message: "Admin created"
    })
})

// READ
app.get('/api/v1/admin', async (req, res, next) => {
    console.log('GET API USER DI REQUEST')
    const result = await prisma.admin.findMany()
    res.json({
        data: result,
        message: 'Admin list'
    })
})

// UPDATE
app.put('/api/v1/admin/:id', accessValidation, async( req, res, next ) => {
    const id = req.params.id
    const { username, password, email } = req.body

    const result = await prisma.admin.update({
        data :{
            username: username,
            password: password,
            email: email
        },
        where : {
            id: Number(id)
        }
    })
    res.json({message: `Admin ${id} updated`})
})

// DELETE
app.delete('/api/v1/admin/:id', accessValidation, async ( req, res, next) => {
    const id = req.params.id

    const result = await prisma.admin.delete({
        where: {
            id: Number(id)
        }
    })
    res.json({message: `Admin ${id} has been deleted`})
})


app.get('/', (req, res) => {
    // SQL untuk memanggil table dari database
    const sql = "SELECT * FROM kerusakan"

    // pemanggilan table dari database menggunakan response()
    db.query(sql, (err, result) => {
        if (err) throw err
        // hasil data dari mysql
        response(200, result, "get all data from kerusakan", res)
    })
})

app.get('/api/v1/kerusakan', (req, res) => {
    const sql = "SELECT * FROM kerusakan"
    db.query(sql, (err, fields) => {
        if (err) throw err
        response(200, fields, "ini data dari kerusakan", res)
    })
})

// fungsi untuk memanggil data seorang murid dengan nim
app.get('/api/v1/kerusakan/:id', (req, res) => {
    const id = req.params.id
    console.log('find id : ', id)
    const sql = `SELECT * FROM kerusakan WHERE id = ${id}`
    db.query(sql, (err, fields) => {
        if (err) throw err
        response(200, fields, "find kerusakan: ", res)
    })
})

app.post("/api/v1/kerusakan", (req, res) => {
    const { gejala, kerusakan, solusi } = req.body 
    const sql = `INSERT INTO kerusakan ( gejala, kerusakan, solusi, gambar ) VALUES ('${gejala}', '${kerusakan}', '${solusi}', NULL)`

    db.query(sql, (err, fields) => {
        if (err) throw response(500, "invalid", err, res)
        if (fields?.affectedRows) {
            const data = {
                isSuccess: fields.affectedRows,
                id: fields.insertId
            }
            response(200, data, "data added succesfuly", res)
        }
    })
})

app.put('/api/v1/kerusakan', (req, res) => {
    const { id, gejala, kerusakan, solusi } = req.body
    const sql = `UPDATE kerusakan SET gejala = '${gejala}', kerusakan = '${kerusakan}', solusi ='${solusi}' WHERE id = ${id}`
    
    db.query(sql, (err, fields) => {
        if (err) throw response(500, "invalid", "error", res)
        if (fields?.affectedRows) {
            const data = {
                isSuccess: fields.affectedRows,
                message: fields.message
                }
            response(200, data, "update data successfuly", res)
        } else {
            response(404, "user not found", "error", res)
        }
    })
})    
    
app.delete("/api/v1/kerusakan", (req, res) => {
    const { id } = req.body
    const sql = `DELETE FROM kerusakan WHERE id = '${id}'`
    db.query(sql, (err, fields) => {
        if (err) throw response (500, "gagal", "error", res)
        if (fields?.affectedRows) {
            const data = {
                isDeleted: fields.affectedRows,
            }
            response(200, data, "Deleting data successful", res)
        } else {
            response (500, "gagal", "error", res)
        }
    })
})  

app.get('/hello', (req, res) => {
    console.log({ getParam: req.query })
    // ini adalah ketika pengecekan username yang dimasukan di frontend apakah tersedia atau tidak
    // const username = req.body.username
    // if (username === usernameForDBExist) {
    //     res.status(400).send('username sudah digunakan!')
    // }
    res.send('Hello World!')
})

// method post digunakan untuk data yang diinpit kan kedalam sebuah form (biasanya) tidak muncul keluar di URL hanya ada pada backend
app.post('/login', (req, res) => {
    console.log({ requstFromOutside: req.body })
    res.send('login berhasil')
    // if(req.name === "ruru") {
    // }
})



// app.put('/mahasiswa', (req, res) => {
//     res.send('ini method put untuk meng-update data')
// })


// url diatas "/mahasiswa" bisa digunakan berkali-kali dengan syarat memiliki method yang berbeda

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})