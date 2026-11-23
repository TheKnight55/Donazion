import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import the Lambda module
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
    const validateOrgExists = (email) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const selectQuery = "SELECT * from donazion.organization_login where email=?";
            pool.query(selectQuery, [email], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows && rows.length > 0);
                }
            });
        });
    };
    // function that will Append password for an existing list
    const appendEntryToList = (email, password) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const insertQuery = "INSERT INTO donazion.organization_login (email,password) VALUES (?,?)";
            pool.query(insertQuery, [email, password], (error, insertResult) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(insertResult);
                }
            });
        });
    };
    // Note how this adds TYPES to the Promise (it will resolve to an array of string[])
    const getPassword = (email) => {
        return new Promise((resolve, reject) => {
            const selectQuery = "SELECT password FROM donazion.organization_login where email=?";
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
            if (password === "") {
                throw new Error("empty password in password field");
            }
            const exists = await validateOrgExists(email); // validate organization exists
            if (exists) {
                console.log("Email exists!");
                const existing_password = await getPassword(email); // and get all entries
                if (password == existing_password) {
                    response.statusCode = 200; // success!
                    response.email = email;
                    response.password = password;
                    console.log("Password matches!");
                }
                else {
                    response.statusCode = 400; // failure
                    response.email = email;
                    response.password = password;
                    console.log("Passwords don't match");
                }
                //const added = await appendEntryToList(email, password)
            }
        }
        else {
            throw new Error("missing email field");
        }
    }
    catch (error) {
        console.error(error);
        response.statusCode = 400;
        response.error = error?.message || String(error);
        response.error = `error: ${JSON.stringify(event)}`; // pass back the actual event that caused problem in first place.
    }
    // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
    return response;
};
//# sourceMappingURL=loginOrganization.mjs.map