const express = require('express');
const session = require('express-session');
const cors = require('cors');
const admininstratorsRoutes = require('./routes/administrators');
const clientsRoutes = require('./routes/clients');
const coachesRoutes = require('./routes/coaches');
const hallsRoutes = require('./routes/halls');
const subscriptionsRoutes = require('./routes/subscriptions');
const trainingSessionsRoutes = require('./routes/training_sessions');
const trainsRoutes = require('./routes/trains');
const scheduleRoutes = require('./routes/schedule');
const workloadRoutes = require('./routes/workload');
const salesRoutes = require('./routes/sales');
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors({
    origin: 'http://localhost:5500',
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
    }
}));
app.use('/api/administrators', admininstratorsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/coaches', coachesRoutes);
app.use('/api/halls', hallsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/training_sessions', trainingSessionsRoutes);
app.use('/api/trains', trainsRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/workload', workloadRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes);

app.listen(8080, () => { 
    console.log("Сервер работает через порт: 8080"); 
});