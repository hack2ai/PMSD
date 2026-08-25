const pool = require("../config/db");

const createPayment = async (
    userId,
    courseId,
    amount,
    paymentMethod,
    paymentStatus,
    transactionId
) => {
    const result = await pool.query(
        `INSERT INTO payments
            (user_id, course_id, amount, payment_method, payment_status, transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, courseId, amount, paymentMethod, paymentStatus, transactionId]
    );

    return result.rows[0];
};

const getPaymentById = async (id) => {
    const result = await pool.query(`SELECT * FROM payments WHERE id = $1`, [id]);
    return result.rows[0];
};

const getUserPayments = async (userId) => {
    const result = await pool.query(
        `SELECT p.*, c.title
         FROM payments p
         JOIN courses c ON p.course_id = c.id
         WHERE p.user_id = $1
         ORDER BY p.paid_at DESC`,
        [userId]
    );
    return result.rows;
};

const getAllPayments = async () => {
    const result = await pool.query(
        `SELECT p.*, u.full_name, u.email, c.title
         FROM payments p
         JOIN users u ON p.user_id = u.id
         JOIN courses c ON p.course_id = c.id
         ORDER BY p.paid_at DESC`
    );
    return result.rows;
};

const updatePaymentStatus = async (id, paymentStatus) => {
    const result = await pool.query(
        `UPDATE payments
         SET payment_status = $1
         WHERE id = $2
           AND (
                (payment_status = 'Pending' AND $1 IN ('Paid', 'Failed', 'Cancelled'))
                OR
                (payment_status = 'Paid' AND $1 = 'Refunded')
           )
         RETURNING *`,
        [paymentStatus, id]
    );

    return result.rows[0];
};

const updatePaymentStatusByTransactionId = async (transactionId, paymentStatus) => {
    const result = await pool.query(
        `UPDATE payments
         SET payment_status = $1
         WHERE transaction_id = $2
           AND (
                (payment_status = 'Pending' AND $1 IN ('Paid', 'Failed', 'Cancelled'))
                OR
                (payment_status = 'Paid' AND $1 = 'Refunded')
           )
         RETURNING *`,
        [paymentStatus, transactionId]
    );

    return result.rows[0];
};

const deletePayment = async (id) => {
    const result = await pool.query(`DELETE FROM payments WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
};

module.exports = {
    createPayment,
    getPaymentById,
    getUserPayments,
    getAllPayments,
    updatePaymentStatus,
    updatePaymentStatusByTransactionId,
    deletePayment
};
