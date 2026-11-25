// Import the Lambda module
import mysql from 'mysql2';
import type { RowDataPacket } from 'mysql2/promise'

interface CategoryEvent {
    name?: string;
}

interface CategoryResponse {
    statusCode: number;
    names?: string[];
    error?: string;
}

// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: process.env.RDS_HOST!,
    user: process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2, // keep small per lambda container
});
export const handler = async (event: CategoryEvent): Promise<any> => {
    // assume this will fail until proven that it will succeed.
    let response: CategoryResponse  = { statusCode: 400 };
    // function that will Insert new ToDo list OR do nothing if already there

    interface NameRow extends RowDataPacket {
      name: string;
    }

    const appendCategory = (name:string) => {
      return new Promise((resolve, reject) => {
        // When creating a new list, it only inserts if not already there...
        const insertQuery = "INSERT INTO donazion.category (name) VALUES (?)";
        pool.query(insertQuery, [name], (error, insertResult) => {
          if (error) {
            reject(new Error("Database error: " + error.message))
          } else {
            resolve(insertResult)
          }
        })
      })
    }

    const getCategories = () => {
      return new Promise<string[]>((resolve, reject) => {
        const selectQuery = "SELECT name FROM donazion.category ORDER BY name"
        pool.query<NameRow[]>(selectQuery, (error, rows) => {
          if (error) {
            reject(new Error("Database error: " + error.message))
          } else {
            // extract out the entries into string[] array (in case any actually exist)
            let justNames:string[] = rows.map((row):string => (row.name))
            resolve(justNames || [])
          }
        })
      })
    }

    try {
        const name = event.name;
        if (name=="retrieve") {
          const names = await getCategories();
          response.statusCode = 200;
          response.names = names;
        } 
        if (name === undefined) {
          throw new Error("missing name field");
        }
        if (name === "") {
          throw new Error("empty name in category field");
        }
        if (name === "retrieve") {
          const names = await getCategories();
          response.statusCode = 200;
          response.names = names;
        } else {
          await appendCategory(name);
          const names = await getCategories();
          response.statusCode = 200;
          console.log("Added " + name + " to categories");
          response.names = names;
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
//# sourceMappingURL=addCategory.mjs.map