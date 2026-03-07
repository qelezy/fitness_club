function requireAuth(req, res, next) {
    const user = req.session && req.session.user;
    if (!user) {
        return res.status(401).json({ message: 'Пользователь не авторизован' });
    }
    next();
}

function requireRole(...roles) {
    return (req, res, next) => {
        const user = req.session && req.session.user;
        if (!user) {
            return res.status(401).json({ message: 'Пользователь не авторизован' });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: 'Недостаточно прав' });
        }
        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};

