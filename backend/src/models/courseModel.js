const pool = require("../config/db");


// =======================================
// Create Course
// =======================================
const createCourse = async (
    title,
    slug,
    description,
    instructor,
    duration,
    category,
    level,
    price,
    created_by
) => {

    const result = await pool.query(
        `
        INSERT INTO courses
        (
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price,
            created_by
        )
        VALUES
        (
            $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        RETURNING *;
        `,
        [
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price,
            created_by
        ]
    );

    return result.rows[0];

};

// =======================================
// Get All Courses
// =======================================
const getAllCourses = async () => {

    const result = await pool.query(
        `
        SELECT *
        FROM courses
        ORDER BY id DESC;
        `
    );

    return result.rows;

};

// =======================================
// Get Course By ID
// =======================================
const getCourseById = async (id) => {

    const result = await pool.query(
        `
        SELECT *
        FROM courses
        WHERE id=$1;
        `,
        [id]
    );

    return result.rows[0];

};

// =======================================
// Update Course
// =======================================
const updateCourse = async (
    id,
    title,
    slug,
    description,
    instructor,
    duration,
    category,
    level,
    price
) => {

    const result = await pool.query(
        `
        UPDATE courses
        SET
            title = $1,
            slug = $2,
            description = $3,
            instructor = $4,
            duration = $5,
            category = $6,
            level = $7,
            price = $8,
            updated_at = NOW()
        WHERE id = $9
        RETURNING *;
        `,
        [
            title,
            slug,
            description,
            instructor,
            duration,
            category,
            level,
            price,
            id
        ]
    );

    return result.rows[0];

};

// =======================================
// Delete Course
// =======================================
const deleteCourse = async (id) => {

    const result = await pool.query(
        `
        DELETE FROM courses
        WHERE id=$1
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
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse
};