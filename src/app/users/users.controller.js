const { Op } = require("sequelize");
const { dbConnection } = require("../../database/database-connection.service");
const { throwIf } = require("../../services/thow-error-class");
const { Encryption } = require("../../services/encryption.service");
const statusCodes = require("../../config/status-codes");
const userService = require("./users.service");
const statusMessages = require("../../config/status-message");

/**
 * @swagger
 * /api/v1/user/create:
 *   post:
 *     tags:
 *       - User
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: John
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: Doe
 *               email:
 *                 type: string
 *                 description: User's email address
 *                 format: email
 *                 example: john.doe@example.com
 *               cellPhone:
 *                 type: string
 *                 description: User's cell phone number
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 description: User's password
 *                 example: P@ssw0rd
 *               profilePic:
 *                 type: string
 *                 description: URL to the user's profile picture
 *                 example: "http://example.com/profile.jpg"
 *               gender:
 *                 type: string
 *                 description: User's gender
 *                 example: Male
 *               education:
 *                 type: string
 *                 description: User's education
 *                 example: Bachelor's Degree
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User is created successfully!
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid input
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already exists
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const createUser = async (req) => {
    const { email, password } = req.body;

    const userInfo = await userService.getUserByCondition({ email });
    throwIf(userInfo, statusCodes.DUPLICATE, statusMessages.USER_EXIST);

    req.body.status = true;
    if (password) {
        req.body.salt = Encryption.makeUserSalt(16);
        req.body.password = Encryption.encryptPassword(password, req.body.salt);
    }
    await userService.createUser(req.body);
    return { message: "User is created successfully!" };
};

/**
 * @swagger
 * /api/v1/users/list:
 *   get:
 *     tags:
 *       - User
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *                   cellPhone:
 *                     type: string
 *                   profilePic:
 *                     type: string
 *                   gender:
 *                     type: string
 *                   education:
 *                     type: string
 *       400:
 *         description: Invalid request
 */
const getAllUsers = async (req) => {
    const { users } = dbConnection.default;
    const { itemPerPage, selectedItems } = req.query;
    const data = await users.findAndCountAll({
        where: { id: { [Op.ne]: req.user.id } },
        limit: itemPerPage,
        offset: (itemPerPage * (selectedItems - 1))
    });
    return { data };
};

/**
 * 
 * @param {*} req 
 * @returns { data } object
 */
const getUserInfoByEmail = async (req) => {
    const { emailId } = req.query;
    const userInfo = await userService.getUserByCondition({ email: emailId });
    return { data: userInfo };
};

module.exports = {
    createUser,
    getAllUsers,
    getUserInfoByEmail
};
