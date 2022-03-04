const handleGenerateAccessToken = require("../authFunctions/handleGenerateAccessToken")
const jwt = require("jsonwebtoken")
const pool = require("../db/ormSettings")

const createTokens = async (user) => {
    const id = user.uid

    const userSharedData = {
        name: user.name,
        uid: id,
        rights: user.rights,
    };

    const accessToken = handleGenerateAccessToken(userSharedData)
    const refreshToken = jwt.sign(userSharedData, process.env.REFRESH_TOKEN_SECRET)

    await pool.query(
        `INSERT INTO refreshTokens (uid, token, user_uid) VALUES (uuid_generate_v4(), $1, $2)
                                                                  ON CONFLICT (user_uid) DO UPDATE SET token = EXCLUDED.token RETURNING *
                `,
        [refreshToken, id]
    )

    return {accessToken, refreshToken}
}

module.exports = createTokens