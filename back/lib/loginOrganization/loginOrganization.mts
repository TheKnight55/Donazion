// Import the Lambda module
import mysql from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise'

interface LoginEvent {
    email?: string;
    password?: string;
}

interface LoginResponse {
    statusCode: number;
    email?: string;
    password?: string;
    error?: string;
}

interface EmailRow extends RowDataPacket {
    email: string;
}

// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: process.env.RDS_HOST!,
    user: process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2, // keep small per lambda container
});
export const handler = async (event: LoginEvent): Promise<any> => {
    // assume this will fail until proven that it will succeed.
    let response: LoginResponse  = { statusCode: 400 };
    // function that will Insert new ToDo list OR do nothing if already there
    const validateOrgExists = (email: string) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const selectQuery = "SELECT * from donazion.organization_login where email=?";
            pool.query<EmailRow[]>(selectQuery, [email], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    resolve(rows && rows.length > 0);
                }
            });
        });
    };

    interface PasswordRow extends RowDataPacket {
        password: string;
    }

    // Note how this adds TYPES to the Promise (it will resolve to an array of string[])
    const getPassword = (email: string) => {
        return new Promise<string | null>((resolve, reject) => {
            const selectQuery = "SELECT password FROM donazion.organization_login where email=?";
            pool.query<PasswordRow[]>(selectQuery, [email], (error, rows) => {
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
            if (password === undefined || password === "") {
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
    }
    // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
    return response;
};
//# sourceMappingURL=loginOrganization.mjs.map