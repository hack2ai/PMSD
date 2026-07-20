const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {

    try {

        console.log("================================");
        console.log("🔐 VERIFY TOKEN MIDDLEWARE");
        console.log("================================");

        const authHeader = req.headers.authorization;

        console.log("Authorization Header:");
        console.log(authHeader);

        if (!authHeader) {

            console.log("❌ No Authorization Header");

            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });

        }

        if (!authHeader.startsWith("Bearer ")) {

            console.log("❌ Invalid Authorization Format");

            return res.status(401).json({
                success: false,
                message: "Authorization header must start with 'Bearer'."
            });

        }

        const token = authHeader.split(" ")[1];

        console.log("JWT Token:");
        console.log(token);

        if (!token) {

            console.log("❌ Token Missing");

            return res.status(401).json({
                success: false,
                message: "Invalid token."
            });

        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log("✅ JWT VERIFIED SUCCESSFULLY");
        console.log(decoded);

        req.user = decoded;

        console.log("✅ req.user:");
        console.log(req.user);

        console.log("================================");

        next();

    } catch (err) {

        console.log("================================");
        console.log("❌ JWT ERROR");
        console.log(err.message);
        console.log("================================");

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token."
        });

    }

};

module.exports = verifyToken;