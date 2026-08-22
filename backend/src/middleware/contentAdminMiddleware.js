const isContentAdmin = (req, res, next) => {
    if (!req.user || !["admin", "instructor"].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: "Content management access denied."
        });
    }

    next();
};

module.exports = isContentAdmin;
