import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import connect from './database/conn.js'
import router from './router/route.js'
import authRouter from './router/authroutes.js'
import session from 'express-session'
import 'dotenv/config'
const app = express()
import './middleware/passport.js'
// middlewares
app.use(
	session({
		secret: process.env.SESSION_SECRET_KEY,
		resave: false,
		saveUninitialized: true,
	})
)
app.use(express.json())
app.use(cors())
app.use(morgan('tiny'))
app.disable('x-powered-by') //less hackers know about our stack

const port = process.env.PORT || 8080;

// HTTP GET Request
app.get('/',(req,res)=>{
    res.status(201).send('Home GET Request.')
})

// api routes
app.use('/api',router)
app.use('/auth', authRouter)

// start server only when we have valid connection
connect().then(()=>{
    try{
        app.listen(port,()=>{
            console.log(`Server connected to  http://localhost:${port}`)
        })
    } catch(error){
        console.log("Can\'t connet to the server");
    }
}).catch(error=>{
    console.log('Invalid databse connection...!');
})