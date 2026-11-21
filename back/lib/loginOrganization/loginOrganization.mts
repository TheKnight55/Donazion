import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import the Lambda module
import * as lambda from 'aws-cdk-lib/aws-lambda';
import mysql from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Append ToDo List use case
 * 
 * If the list does not exists, return 400 error
 * If it does exist, append to its list of values.
 */

/**
 * Incoming JSON payload:
 * 
 * { 
 *   "email" : "login@donazion.com", 
 *   "password" : "banana1234"
 *  }
 */
interface RequestPayload {
  email: string,
  password: string
}

/**
 * Outgoing JSON payload:
 * 
 * { "statusCode" : 200 | 400,
 *   on success:
 *      will have "email" : "login@donazion.com"
 *      will have "password" : "banana1234"
 *   on failure:
 *      will have "error" : "e" on failure
 * }
 */
interface ResponsePayload {
  statusCode: number,        // always exists
  email? : string,
  password?: string,
  error?: string
}

// specify credentials. Created OUTSIDE handler, so it can be reused 
const pool = mysql.createPool({
    host: 	process.env.RDS_HOST!,
    user: 	process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2, // keep small per lambda container
})

export const handler = async (event: RequestPayload): Promise<any> => {

  // assume this will fail until proven that it will succeed.
  let response:ResponsePayload = { statusCode: 400 } 

  // Get all task entries in a specific list. What is returned?
  interface ListRow extends RowDataPacket {
    email: string
  }

  // function that will Insert new ToDo list OR do nothing if already there
  const validateToDoListExists = (email:string) => {
    return new Promise((resolve, reject) => {

      // When creating a new list, it only inserts if not already there...
      const selectQuery = "SELECT * from donazion.organization_login where email=${email}"

      pool.query<ListRow[]>(selectQuery, [email], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(rows && rows.length > 0)
        }
      })
    })
  }

  // function that will Append password for an existing list
  const appendEntryToList = (email:string, password:string) => {
    return new Promise((resolve, reject) => {

      // When creating a new list, it only inserts if not already there...
      const insertQuery = "INSERT INTO donazion.organization_login (email,password) VALUES (e,p)"

      pool.query(insertQuery, [email, password], (error, insertResult) => {
        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(insertResult)
        }
      })
    })
  }

  // Get all task entries in a specific list. What is returned?
  interface EntryRow extends RowDataPacket {
    entry: string
  }

  // Note how this adds TYPES to the Promise (it will resolve to an array of string[])
  const getPassword = (email:string) => {
    return new Promise<string | null>((resolve, reject) => {
      const selectQuery = "SELECT password FROM donazion.organization_login where email=?"
      pool.query<EntryRow[]>(selectQuery, [email], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          if (rows.length > 0) {
            resolve(rows[0]?.password);
          } else {
            resolve(null);
          }
        }
      })
    })
  }

  try {
    const email = event.email
    if (email !== undefined) {
      if (email === "") {
        throw new Error ("empty email in email field")
      }
      const password = event.password
      if (password === "") {
        throw new Error ("empty password in password field")
      }

      const exists  = await validateToDoListExists(email)    // validate ToDo list exists
      if (exists) {
        const added = await appendEntryToList(email, password)
        const existing_password:string | null = await getPassword(email)     // and get all entries

        response.statusCode = 200                  // success!
        response.email = email
        response.password = password                 // this is 'inner' object containing entries
      }
    } else {
      throw new Error ("missing email field")
    }

  } catch (error) {
    response.error = `error: ${JSON.stringify(event)}`  // pass back the actual event that caused problem in first place.
  }

  // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
  return response
}

