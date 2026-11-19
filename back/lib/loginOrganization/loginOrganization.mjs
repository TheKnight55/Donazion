import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import the Lambda module
import * as lambda from 'aws-cdk-lib/aws-lambda';
import mysql from 'mysql2';
import { RowDataPacket } from 'mysql2/promise';
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
    const validateToDoListExists = (name) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const selectQuery = "SELECT * from calc.Lists where name=?";
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
    // function that will Append entry for an existing list
    const appendEntryToList = (name, entry) => {
        return new Promise((resolve, reject) => {
            // When creating a new list, it only inserts if not already there...
            const insertQuery = "INSERT INTO donazion.organization_login (list,entry) VALUES (?,?)";
            pool.query(insertQuery, [name, entry], (error, insertResult) => {
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
    const getEntries = (name) => {
        return new Promise((resolve, reject) => {
            const selectQuery = "SELECT entry FROM calc.Entries where list=?";
            pool.query(selectQuery, [name], (error, rows) => {
                if (error) {
                    reject(new Error("Database error: " + error.message));
                }
                else {
                    // extract out the entries into string[] array (in case any actually exist)
                    let justEntries = rows.map((row) => (row.entry));
                    resolve(justEntries || []);
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
            const entry = event.entry;
            if (entry === "") {
                throw new Error("empty entry in entry field");
            }
            const exists = await validateToDoListExists(name); // validate ToDo list exists
            if (exists) {
                const added = await appendEntryToList(name, entry);
                const entries = await getEntries(name); // and get all entries
                response.statusCode = 200; // success!
                response.name = name;
                response.entries = entries; // this is 'inner' object containing entries
            }
        }
        else {
            throw new Error("missing name field");
        }
    }
    catch (error) {
        response.error = `error: ${JSON.stringify(event)}`; // pass back the actual event that caused problem in first place.
    }
    // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
    return response;
};
//# sourceMappingURL=loginOrganization.mjs.map