import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import connect from './database/conn.js'
import session from 'express-session'
import CorsConfig from './cors.config.js'
import 'dotenv/config'

import userRouter from './router/userRoutes.js'
import insRouter from './router/insRoutes.js'
import adminRouter from './router/adminRoutes.js'
import cartWishlistRouter from './router/cartWishlistRoutes.js'
import helpersRouter from './router/helpersRoutes.js'
import coursesRouter from './router/coursesRoutes.js'
import pagesRouter from './router/pagesRoute.js'
import authRouter from './router/authRoutes.js'
import qnaRouter from './router/qnaRoutes.js'
import jobopeningsRoute from './router/jobopeningsRoute.js'
import collegeUserRoute from './router/collegeuserRoute.js'
import assessmentRoutes from './router/assessmentRoutes.js'
import * as ServerStatus from './middleware/helper.js'
const app = express()
import './middleware/passport.js'
import passport from 'passport'
// middlewares
app.use(
    session({
        name: "session.hm.courses",
        secret: process.env.SESSION_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false,
            maxAge: 3 * 30 * 24 * 60 * 60 * 1000, // 3 months in milliseconds
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json())

app.use(cors({
    origin: CorsConfig,
    credentials: true,
}));
app.use(morgan('tiny'))
app.disable('x-powered-by') //less hackers know about our stack

const port = process.env.PORT || 3009;

// HTTP GET Request
app.get('/', ServerStatus.getServerLoadInfo , (req, res) => {
    const uptime =  ServerStatus.calculateUptime();
    const serverLoadInfo = req.serverLoadInfo;
    res.status(201).send({
        success: true,
        message: 'Hoping Minds Backend!',
        dateTime: new Date().toLocaleString(),
        connectedClient: process.env.CLIENT_BASE_URL,
        systemStatus:{
            uptime: `${uptime}s`,
            cpuLoad: serverLoadInfo.cpuLoad,
            memoryUsage: serverLoadInfo.memoryUsage,
        }
    })
})

// api routes
app.use('/api', adminRouter)
app.use('/api', cartWishlistRouter)
app.use('/api', coursesRouter)
app.use('/api', helpersRouter)
app.use('/api', insRouter)
app.use('/api', userRouter)
app.use('/api', pagesRouter)
app.use('/api', qnaRouter)
app.use('/api', collegeUserRoute)
app.use('/api', jobopeningsRoute)
app.use('/api', assessmentRoutes)
app.use('/auth', authRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// start server only when we have valid connection
connect().then(() => {
    try {
        app.listen(port, () => {
            ServerStatus.captureStartTime()
            console.log(`Server connected to  http://localhost:${port}`)
        })
    } catch (error) {
        console.log("Can\'t connet to the server");
    }
}).catch(error => {
    console.log('Invalid databse connection...!');
})
