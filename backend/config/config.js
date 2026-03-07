const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_NAME || 'fitness_club',
        port: Number(process.env.DB_PORT) || 5432
    },
    server: {
        port: Number(process.env.PORT) || 8080,
        corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5500',
        sessionSecret: process.env.SESSION_SECRET || 'secret'
    }
};

module.exports = config;

