import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// Import the Lambda module
import * as lambda from 'aws-cdk-lib/aws-lambda';
import mysql from 'mysql2'
import type { RowDataPacket } from 'mysql2/promise'

/**
 * List DonationCenters use case
 *
 * Returns all registered donation centers, including
 * their location and inventory totals.
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
 *      "donationCenters" : [
 *          {
 *              "name" : "Food Pantry",
 *              "email" : "food@example.com",
 *              "street" : "100 Institute Rd",
 *              "city" : "Worcester",
 *              "state" : "MA",
 *              "zipcode" : "01609",
 *              "latitude" : 42.2746,
 *              "longitude" : -71.8056,
 *              "totalItems" : 10,
 *              "totalValue" : 250.00
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
  longitude: number,
  totalItems: number,
  totalValue: number
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
   * Get all registered donation centers.
   *
   * LEFT JOIN is used so that a donation center with
   * no inventory still appears in the results.
   */
  interface DonationCenterRow extends RowDataPacket {
    name: string,
    email: string,
    street: string,
    city: string,
    state: string,
    zipcode: string,
    latitude: number,
    longitude: number,
    totalItems: number,
    totalValue: number
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
          l.longitude,
          COALESCE(SUM(i.quantity), 0) AS totalItems,
          COALESCE(SUM(i.market_value * i.quantity), 0) AS totalValue

        FROM donazion.donation_center dc

        LEFT JOIN donazion.location l
          ON dc.name = l.donation_center_name

        LEFT JOIN donazion.inventory i
          ON dc.name = i.donation_center_name

        WHERE dc.registered = 1

        GROUP BY
          dc.name,
          dc.email,
          l.street,
          l.city,
          l.state,
          l.zipcode,
          l.latitude,
          l.longitude

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
              longitude: row.longitude,
              totalItems: row.totalItems,
              totalValue: row.totalValue
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