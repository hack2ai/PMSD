const pool = require("../config/db");

// =======================================
// Create Enrollment
// =======================================
const createEnrollment = async (userId, courseId) => {

    const result = await pool.query(
        `
        INSERT INTO enrollments
        (
            user_id,
            course_id
        )
        VALUES
        (
            $1,
            $2
        )
        RETURNING *;
        `,
        [userId, courseId]
    );

    return result.rows[0];

};

// =======================================
// Check Existing Enrollment
// =======================================
const findEnrollment = async (userId, courseId) => {

    const result = await pool.query(
        `
        SELECT *
        FROM enrollments
        WHERE user_id = $1
        AND course_id = $2;
        `,
        [userId, courseId]
    );

    return result.rows[0];

};

// =======================================
// Get User Enrollments
// =======================================
const getUserEnrollments = async (userId) => {

    const result = await pool.query(
        `
        SELECT
            e.id,
            e.enrolled_at,
            c.id AS course_id,
            c.title,
            c.description,
            c.instructor,
            c.thumbnail
        FROM enrollments e
        JOIN courses c
            ON e.course_id = c.id
        WHERE e.user_id = $1
        ORDER BY e.enrolled_at DESC;
        `,
        [userId]
    );

    return result.rows;

};

// =======================================
// Get All Enrollments
// =======================================
const getAllEnrollments = async () => {

    const result = await pool.query(
        `
        SELECT
            e.id,
            e.enrolled_at,
            u.full_name,
            u.email,
            c.title
        FROM enrollments e
        JOIN users u
            ON e.user_id = u.id
        JOIN courses c
            ON e.course_id = c.id
        ORDER BY e.enrolled_at DESC;
        `
    );

    return result.rows;

};

// =======================================
// Delete Enrollment
// =======================================
const deleteEnrollment = async (id) => {

    const result = await pool.query(
        `
        DELETE FROM enrollments
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
    createEnrollment,
    findEnrollment,
    getUserEnrollments,
    getAllEnrollments,
    deleteEnrollment
};