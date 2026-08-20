const jwt = require("jsonwebtoken");

const MEDIA_TOKEN_TTL = process.env.MEDIA_TOKEN_TTL || "5m";

const signMediaToken = ({ userId, lectureId, sessionId }) => jwt.sign(
    {
        type: "lecture-media",
        sub: String(userId),
        lectureId: String(lectureId),
        sessionId: String(sessionId)
    },
    process.env.JWT_SECRET,
    { expiresIn: MEDIA_TOKEN_TTL }
);

const verifyMediaToken = (token) => {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "lecture-media") {
        throw new Error("Invalid media token type.");
    }
    return decoded;
};

module.exports = { signMediaToken, verifyMediaToken };
