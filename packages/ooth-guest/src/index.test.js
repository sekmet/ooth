import Ooth from 'ooth'
import express from 'express'
import session from 'express-session'
import request from 'request-promise'
import oothGuest from '.'
import {MongoClient} from 'mongodb'

let mongoUrl = 'mongodb://localhost:27017/oothtest'
let config
let app
let server
let ooth
let oothGuestConfig
let db
let cookies = ''

const startServer = () => {
    return new Promise((resolve) => {
        server = app.listen(8080, resolve())
    })
}

const obfuscate = (obj, ...keys) => {
    const res = {}
    for (const key of Object.keys(obj)) {
        if (keys.indexOf(key) > -1) {
            res[key] = '<obfuscated>'
        } else {
            res[key] = obj[key]            
        }
    }

    return res
}

describe('ooth-guest', () => {
    beforeAll(async () => {
        db = await MongoClient.connect(mongoUrl)
        await db.dropDatabase()
    })

    beforeEach(async () => {
        config = {
            mongoUrl,
            sharedSecret: '',
            standalone: false,
            path: '',
            onLogin: () => null,
            onLogout: () => null,
        }
        oothGuestConfig = {
            clientID: 'XXX',
            clientSecret: 'XXX',
        }
        app = express()
        app.use(session({
            name: 'api-session-id',
            secret: 'x',
            resave: false,
            saveUninitialized: true,
        }))
        ooth = new Ooth(config)
        await ooth.start(app)
        ooth.use('guest', oothGuest(oothGuestConfig))
        await startServer(app)
    })

    afterEach(async () => {
        await server.close()
        await db.dropDatabase()
        cookies = ''
    })

    test('registers routes', async () => {
        const res = await request({
            uri: 'http://localhost:8080/',
            json: true,
        })
        expect(res).toMatchSnapshot()
    })

    test('can register', async () => {
        const res = await request({
            method: 'POST',
            uri: 'http://localhost:8080/guest/register',
            json: true,
        })

        expect(obfuscate(res.user, '_id')).toMatchSnapshot()
    })
});