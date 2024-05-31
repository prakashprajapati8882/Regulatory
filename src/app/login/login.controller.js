const { Encryption } = require("../../services/encryption.service");
const { throwIfNot, throwIf } = require("../../services/thow-error-class");
const statusCodes = require("../../config/status-codes");
const statusMessages = require("../../config/status-message");
const { issueJwt } = require("./login.service");
const userService = require("../users/users.service");

const login = async function (req) {
    const { email, password } = req.body;

    // check validate email and password exist in body
    throwIfNot((email || password), statusCodes.BAD_REQUEST, statusMessages.EMAIL_PASSWORD_NOT_FOUND);

    // Check If user email exist or not
    const [userInfo, error] = await handlePromise(userService.getUserByCondition({ email }));
    throwIf(error, statusCodes.BAD_REQUEST, statusMessages.USER_NOT_FOUND);

    throwIfNot(userInfo, statusCodes.NOT_FOUND, statusMessages.USER_NOT_FOUND);

    // Check for Password Match
    const passwordHash = Encryption.encryptPassword(password, userInfo.salt);
    throwIfNot((passwordHash === userInfo.password), statusCodes.BAD_REQUEST, statusMessages.INVALID_EMAIL_OR_PASSWORD);

    throwIfNot(userInfo.status, statusCodes.NOT_FOUND, statusMessages.USER_NOT_ACTIVE);

    const token = issueJwt(userInfo);
    return { token };
};

/**
 * @swagger
 * /api/v1/register:
 *   post:
 *     tags:
 *       - User
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *                 format: binary
 *                 description: Profile image file
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
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully!
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
 */
const registerUser = async (req) => {
    const { email, password } = req.body;

    const userInfo = await userService.getUserByCondition({ email });
    throwIf(userInfo, statusCodes.DUPLICATE, statusMessages.USER_EXIST);

    req.body.status = false;
    req.body.salt = Encryption.makeUserSalt(16);
    req.body.password = Encryption.encryptPassword(password, req.body.salt);

    await userService.createUser(req.body);
    return { message: statusMessages.USER_REGISTERED };
};

module.exports = {
    login,
    registerUser
};
