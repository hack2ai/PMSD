const pool = require("../config/db");

// =======================================
// Create User
// =======================================
const createUser = async (fullName, email, hashedPassword, role) => {

    const result = await pool.query(
        `
        INSERT INTO users (
            full_name,
            email,
            password,
            role
        )
        VALUES ($1, $2, $3, $4)
        RETURNING
            id,
            full_name,
            email,
            role,
            profile_image,
            created_at;
        `,
        [fullName, email, hashedPassword, role]
    );

    return result.rows[0];

};

// =======================================
// Find User By Email
// =======================================
const findUserByEmail = async (email) => {

    const result = await pool.query(
        `
        SELECT *
        FROM users
        WHERE email = $1
        `,
        [email]
    );

    return result.rows[0];

};

// =======================================
// Find User By ID
// =======================================
const findUserById = async (id) => {

    console.log("🔍 findUserById():", id);

    const result = await pool.query(
        `
        SELECT
            id,
            full_name,
            email,
            role,
            profile_image,
            created_at
        FROM users
        WHERE id = $1
        `,
        [id]
    );

    console.log("📄 Query Result:", result.rows);

    return result.rows[0];

};

// =======================================
// Get All Users
// =======================================
const getAllUsers = async () => {

    const result = await pool.query(
        `
        SELECT
            id,
            full_name,
            email,
            role,
            profile_image,
            created_at
        FROM users
        ORDER BY id DESC
        `
    );

    return result.rows;

};

// =======================================
// Update User Profile
// =======================================
const updateUserProfile = async (
    id,
    full_name,
    email
) => {

    const result = await pool.query(
        `
        UPDATE users
        SET
            full_name = $1,
            email = $2
        WHERE id = $3
        RETURNING
            id,
            full_name,
            email,
            role,
            profile_image,
            created_at;
        `,
        [full_name, email, id]
    );

    return result.rows[0];

};

// =======================================
// Export
// =======================================
module.exports = {
    createUser,
    findUserByEmail,
    findUserById,
    getAllUsers,
    updateUserProfile
};