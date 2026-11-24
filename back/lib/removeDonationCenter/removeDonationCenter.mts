import mysql, { type ResultSetHeader } from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Register Donation Center use case (donation center dashboard)
 *
 * Called by a logged-in donation center to register itself with the organization.
 * Only changes the registered flag. The center's account, inventory, wishlist and
 * location are untouched, so it can keep using the site either way.
 *
 * If the donation center does not exist, return 400 error
 * If it is already registered, return 400 error ("already registered")
 * Otherwise set registered = true.
 */

/**
 * Incoming JSON payload (name of the logged-in donation center):
 *
 * {
 *   "name" : "Some Center"
 * }
 */
interface RequestPayload {
  name: string
}

/**
 * Outgoing JSON payload:
 *
 * { "statusCode" : 200 | 400,
 *   on success:
 *      will have "name" : "Some Center"
 *      will have "registered" : true
 *   on failure:
 *      will have "error"
 * }
 */
interface ResponsePayload {
  statusCode: number,        // always exists
  name?: string,
  registered?: boolean,
  error?: string
}

// specify credentials. Created OUTSIDE handler, so it can be reused
const pool = mysql.createPool({
    host:     process.env.RDS_HOST!,
    user:     process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2, // keep small per lambda container
})

export const handler = async (event: RequestPayload): Promise<any> => {

  // assume this will fail until proven that it will succeed.
  let response:ResponsePayload = { statusCode: 400 }

  interface CenterRow extends RowDataPacket {
    name: string
  }

  // Does a donation center with this name exist?
  const centerExists = (name:string) => {
    return new Promise<boolean>((resolve, reject) => {
      const selectQuery = "SELECT name FROM donation_center WHERE name=?"

      pool.query<CenterRow[]>(selectQuery, [name], (error, rows) => {
        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(rows && rows.length > 0)
        }
      })
    })
  }

  // Flip registered to true ONLY if it is currently false.
  // Resolves to the number of rows changed (1 = success, 0 = already registered)
  const removeCenter = (name:string) => {
    return new Promise<number>((resolve, reject) => {
      const updateQuery = "UPDATE donation_center SET registered = FALSE WHERE name=? AND registered = TRUE"

      pool.query<ResultSetHeader>(updateQuery, [name], (error, updateResult) => {
        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(updateResult.affectedRows)
        }
      })
    })
  }

  try {
    const name = event.name
    if (name !== undefined) {
      if (name === "") {
        throw new Error ("empty name in name field")
      }

      const exists = await centerExists(name)               // validate donation center exists
      if (!exists) {
        throw new Error ("donation center not found")
      }

      const changed = await removeCenter(name)            // check + update in one statement
      if (changed === 0) {
        throw new Error ("already unregistered")
      }

      response.statusCode = 200                             
      response.name = name
      response.registered = false                            // dashboard can update its status from this
    } else {
      throw new Error ("missing name field")
    }

  } catch (error) {
    response.error = (error as Error).message               // pass back the reason it failed
  }

  // Since pool is defined OUTSIDE of lambda function, no need to end() or close()
  return response
}