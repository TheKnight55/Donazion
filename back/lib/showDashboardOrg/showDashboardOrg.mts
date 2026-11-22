import mysql from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * Show Organization Dashboard use case
 *
 * Returns summary information about all registered
 * donation centers and their inventory.
 */

/**
 * Incoming JSON payload:
 *
 * { }
 */

/**
 * Outgoing JSON payload:
 *
 * {
 *   "statusCode" : 200 | 400,
 *   on success:
 *      "donationCenters" : 5,
 *      "totalItems" : 143,
 *      "totalValue" : 3250.75
 *   on failure:
 *      "error" : "e"
 * }
 */

interface ResponsePayload {
  statusCode: number,
  donationCenters?: number,
  totalItems?: number,
  totalValue?: number,
  error?: string
}

// specify credentials. Created OUTSIDE handler, so it can be reused
const pool = mysql.createPool({
    host: process.env.RDS_HOST!,
    user: process.env.RDS_USER!,
    password: process.env.RDS_PASSWORD!,
    database: process.env.RDS_DATABASE!,
    connectionLimit: 2,
})

export const handler = async (event: any): Promise<any> => {

  // assume this will fail until proven that it will succeed.
  let response:ResponsePayload = { statusCode: 400 }

  /**
   * Get the number of registered donation centers.
   */
  interface CenterCountRow extends RowDataPacket {
    donationCenters: number
  }

  const getDonationCenterCount = () => {
    return new Promise<number>((resolve, reject) => {

      const selectQuery = `
        SELECT COUNT(*) AS donationCenters
        FROM donazion.donation_center
        WHERE registered = 1
      `

      pool.query<CenterCountRow[]>(selectQuery, [], (error, rows) => {

        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(rows[0]?.donationCenters || 0)
        }

      })
    })
  }

  /**
   * Get the total number of inventory items and
   * total market value of all inventory.
   */
  interface InventoryRow extends RowDataPacket {
    totalItems: number
    totalValue: number
  }

  const getInventoryTotals = () => {
    return new Promise<InventoryRow>((resolve, reject) => {

      const selectQuery = `
        SELECT
          COALESCE(SUM(quantity), 0) AS totalItems,
          COALESCE(SUM(market_value * quantity), 0) AS totalValue
        FROM donazion.inventory
      `

      pool.query<InventoryRow[]>(selectQuery, [], (error, rows) => {

        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {
          resolve(rows[0])
        }

      })
    })
  }

  try {

    const donationCenters:number = await getDonationCenterCount()

    const inventoryTotals:InventoryRow = await getInventoryTotals()

    response.statusCode = 200
    response.donationCenters = donationCenters
    response.totalItems = inventoryTotals.totalItems
    response.totalValue = inventoryTotals.totalValue

  } catch (error) {

    response.error = `error: ${JSON.stringify(event)}`

  }

  // Since pool is defined OUTSIDE of lambda function,
  // no need to end() or close()
  return response
}