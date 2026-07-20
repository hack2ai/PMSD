const pool = require("../config/db");

// =======================================
// Generate Certificate
// =======================================
const createCertificate = async (
    userId,
    courseId,
    certificateNumber,
    certificateUrl
) => {

    const result = await pool.query(
        `
        INSERT INTO certificates
        (
            user_id,
            course_id,
            certificate_number,
            certificate_url
        )
        VALUES
        (
            $1,$2,$3,$4
        )
        RETURNING *;
        `,
        [
            userId,
            courseId,
            certificateNumber,
            certificateUrl
        ]
    );

    return result.rows[0];

};

// =======================================
// Find Certificate By Number
// =======================================
const getCertificateByNumber = async (
    certificateNumber
) => {

    const result = await pool.query(
        `
        SELECT
            c.*,
            u.full_name,
            u.email,
            co.title
        FROM certificates c
        JOIN users u
            ON c.user_id = u.id
        JOIN courses co
            ON c.course_id = co.id
        WHERE c.certificate_number = $1;
        `,
        [certificateNumber]
    );

    return result.rows[0];

};

// =======================================
// Get My Certificates
// =======================================
const getMyCertificates = async (userId) => {

    const result = await pool.query(
        `
        SELECT
            c.*,
            co.title
        FROM certificates c
        JOIN courses co
            ON c.course_id = co.id
        WHERE c.user_id = $1
        ORDER BY c.issued_at DESC;
        `,
        [userId]
    );

    return result.rows;

};

// =======================================
// Get All Certificates
// =======================================
const getAllCertificates = async () => {

    const result = await pool.query(
        `
        SELECT
            c.*,
            u.full_name,
            u.email,
            co.title
        FROM certificates c
        JOIN users u
            ON c.user_id = u.id
        JOIN courses co
            ON c.course_id = co.id
        ORDER BY c.issued_at DESC;
        `
    );

    return result.rows;

};

// =======================================
// Delete Certificate
// =======================================
const deleteCertificate = async (id) => {

    const result = await pool.query(
        `
        DELETE FROM certificates
        WHERE id = $1
        RETURNING *;
        `,
        [id]
    );

    return result.rows[0];

};

// =======================================
// Export
// =======================================
module.exports = {
    createCertificate,
    getCertificateByNumber,
    getMyCertificates,
    getAllCertificates,
    deleteCertificate
};