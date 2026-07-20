const bcrypt = require("bcrypt");

const {
    findUserById,
    updateUserProfile,
    getAllUsers
} = require("../models/userModel");

// =======================================
// Get Logged-in User Profile
// =======================================
const getMyProfile = async (req, res) => {

    try {

        const user = await findUserById(req.user.id);

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User not found."
            });

        }

        return res.status(200).json({
            success: true,
            user
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Update Logged-in User Profile
// =======================================
const updateMyProfile = async (req, res) => {

    try {

        const { full_name, email } = req.body;

        if (!full_name || !email) {

            return res.status(400).json({
                success: false,
                message: "Full name and email are required."
            });

        }

        const updatedUser = await updateUserProfile(
            req.user.id,
            full_name,
            email
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: updatedUser
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Get All Users (Admin)
// =======================================
const getUsers = async (req, res) => {

    try {

        const users = await getAllUsers();

        return res.status(200).json({
            success: true,
            total: users.length,
            users
        });

    } catch (err) {

        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

// =======================================
// Export Controllers
// =======================================
module.exports = {
    getMyProfile,
    updateMyProfile,
    getUsers
};