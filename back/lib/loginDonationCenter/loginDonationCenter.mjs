// Import the Lambda module
import mysql from 'mysql2';
// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: process.env.RDS_HOST,
    user: process.env.RDS_USER,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DATABASE,
    connectionLimit: 2, // keep small per lambda container
});
export const handler = async (event) => {
    // assume this will fail until proven that it will succeed.
    let response = { statusCode: 400 };
    // function that will Insert new ToDo list OR do nothing if already there
    const validateDCExists = (email) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const selectQuery = "SELECT * from donazion.donation_center where email=?";
            pool.query(selectQuery, [email], (error, rows) => {
                if (error) {
                    console.error("Database error: " + error.message);
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows && rows.length > 0);
                }
            });
        });
    };
    // Note how this adds TYPES to the Promise (it will resolve to an array of string[])
    const getPassword = (email) => {
        return new Promise((resolve, reject) => {
            const selectQuery = "SELECT password FROM donazion.donation_center where email=?";
            pool.query(selectQuery, [email], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    if (rows.length > 0 && rows[0]?.password !== undefined) {
                        resolve(rows[0]?.password ?? null);
                    }
                    else {
                        resolve(null);
                    }
                }
            });
        });
    };
    try {
        const email = event.email;
        if (email !== undefined) {
            if (email === "") {
                throw new Error("empty email in email field");
            }
            const password = event.password;
            if (!password) {
                throw new Error("empty password in password field");
            }
            const exists = await validateDCExists(email); // validate organization exists
            if (exists) {
                console.log("Email exists!");
                const existing_password = await getPassword(email); // and get all entries
                if (password == existing_password) {
                    response.statusCode = 200; // success!
                    response.email = email;
                    response.password = password;
                    console.log("Password matches!");
                    return response;
                }
                else {
                    throw new Error("passwords don't match");
                }
            }
            else {
                throw new Error("wrong email");
            }
        }
        else {
            throw new Error("missing email field");
        }
    }
    catch (error) {
        console.error(error);
        response.statusCode = 400;
        response.error = error instanceof Error ? error.message : String(error);
        return response;
    }
    // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
    return response;
};
//# sourceMappingURL=loginOrganization.mjs.map
//# sourceMappingURL=loginDonationCenter.mjs.map