import mysql from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * List DonationCenters use case for Donor
 *
 * Returns all registered donation centers,
 * including their location.
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
 *
 *   on success:
 *      "donationCenters" : [
 *          {
 *              "name" : "Food Pantry",
 *              "email" : "food@example.com",
 *              "street" : "100 Institute Rd",
 *              "city" : "Worcester",
 *              "state" : "MA",
 *              "zipcode" : "01609",
 *              "latitude" : 42.2746,
 *              "longitude" : -71.8056
 *          }
 *      ]
 *
 *   on failure:
 *      "error" : "e"
 * }
 */

interface ResponsePayload {
  statusCode: number,
  donationCenters?: DonationCenter[],
  error?: string
}

interface DonationCenter {
  name: string,
  email: string,
  street: string,
  city: string,
  state: string,
  zipcode: string,
  latitude: number,
  longitude: number
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
   * Get all registered donation centers
   * and their locations.
   */
  interface DonationCenterRow extends RowDataPacket {
    name: string,
    email: string,
    street: string,
    city: string,
    state: string,
    zipcode: string,
    latitude: number,
    longitude: number
  }

  const getDonationCenters = () => {
    return new Promise<DonationCenter[]>((resolve, reject) => {

      const selectQuery = `
        SELECT
          dc.name,
          dc.email,
          l.street,
          l.city,
          l.state,
          l.zipcode,
          l.latitude,
          l.longitude

        FROM donazion.donation_center dc

        LEFT JOIN donazion.location l
          ON dc.name = l.donation_center_name

        WHERE dc.registered = 1

        ORDER BY dc.name
      `

      pool.query<DonationCenterRow[]>(selectQuery, [], (error, rows) => {

        if (error) {
          reject(new Error("Database error: " + error.message))
        } else {

          let donationCenters:DonationCenter[] =
            rows.map((row):DonationCenter => ({
              name: row.name,
              email: row.email,
              street: row.street,
              city: row.city,
              state: row.state,
              zipcode: row.zipcode,
              latitude: row.latitude,
              longitude: row.longitude
            }))

          resolve(donationCenters || [])
        }

      })
    })
  }

  try {

    const donationCenters:DonationCenter[] =
      await getDonationCenters()

    response.statusCode = 200
    response.donationCenters = donationCenters

  } catch (error) {

    response.error = `error: ${JSON.stringify(event)}`

  }

  // Since pool is defined OUTSIDE of lambda function,
  // no need to end() or close()
  return response
}