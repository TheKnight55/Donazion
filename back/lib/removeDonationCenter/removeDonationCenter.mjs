import mysql, {} from 'mysql2';
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
    // Does a donation center with this name exist?
    const centerExists = (name) => {
        return new Promise((resolve, reject) => {
            const selectQuery = "SELECT name FROM donazion.donation_center WHERE name=?";
            pool.query(selectQuery, [name], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows && rows.length > 0);
                }
            });
        });
    };
    // Flip registered to true ONLY if it is currently false.
    // Resolves to the number of rows changed (1 = success, 0 = already registered)
    const removeCenter = (name) => {
        return new Promise((resolve, reject) => {
            const updateQuery = "UPDATE donazion.donation_center SET registered = FALSE WHERE name=? AND registered = TRUE";
            pool.query(updateQuery, [name], (error, updateResult) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(updateResult.affectedRows);
                }
            });
        });
    };
    try {
        const name = event.name;
        if (name !== undefined) {
            if (name === "") {
                throw new Error("empty name in name field");
            }
            const exists = await centerExists(name); // validate donation center exists
            if (!exists) {
                throw new Error("donation center not found");
            }
            const changed = await removeCenter(name); // check + update in one statement
            if (changed === 0) {
                throw new Error("already unregistered");
            }
            response.statusCode = 200;
            response.name = name;
            response.registered = false; // dashboard can update its status from this
        }
        else {
            throw new Error("missing name field");
        }
    }
    catch (error) {
        response.error = error.message; // pass back the reason it failed
    }
    // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
    return response;
};
//# sourceMappingURL=removeDonationCenter.mjs.map