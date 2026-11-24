"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import OrganizationHeader from "../../components/OrganizationHeader"
interface DonationCenter {
    name: string
    email: string
    street: string
    city: string
    state: string
    zipcode: string
    latitude: number
    longitude: number
    totalItems: number
    totalValue: number
}
interface DonationCenterResponse {
    statusCode: number
    donationCenters?: DonationCenter[]
    error?: string
}
export default function ListDonationCenters() {
    const router = useRouter()
    const [centers, setCenters] =
        useState<DonationCenter[]>([])
    const [loading, setLoading] =
        useState(true)
    const [error, setError] =
        useState("")
    /*
     * Load the donation centers from the Lambda.
     */
    useEffect(() => {
        async function loadDonationCenters() {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/todo/listDonationCenters`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({})
                    }
                )
                const data:DonationCenterResponse =
                    await response.json()
                if (data.statusCode !== 200) {
                    setError(
                        data.error || "Unable to load donation centers."
                    )
                    return
                }
                setCenters(
                    data.donationCenters || []
                )
            }
            catch (error) {
                setError(
                    "Unable to connect to the server."
                )
            }
            finally {
                setLoading(false)
            }
        }
        loadDonationCenters()
    }, [])
    return (
        <main>
            <OrganizationHeader />
            <div className="donation-centers-page">
                <div className="page-title">
                    <h2>
                        List of Donation Centers
                    </h2>
                    <button
                        onClick={() =>
                            router.push("/organization")
                        }
                    >
                        Return to Dashboard
                    </button>
                </div>
                {loading && (
                    <p>
                        Loading donation centers...
                    </p>
                )}
                {error && (
                    <div className="error">
                        <p>
                            {error}
                        </p>
                    </div>
                )}
                {!loading && !error && (
                    <div className="donation-center-list">
                        {centers.length === 0 ? (
                            <p>
                                No registered donation centers found.
                            </p>
                        ) : (
                            centers.map((center) => (
                                <div
                                    className="donation-center"
                                    key={center.name}
                                >
                                    <h3>
                                        {center.name}
                                    </h3>
                                    <p>
                                        {center.street}
                                    </p>
                                    <p>
                                        {center.city}, {center.state}{" "}
                                        {center.zipcode}
                                    </p>
                                    <div className="inventory-summary">
                                        <div>
                                            <strong>
                                                Total Items
                                            </strong>
                                            <p>
                                                {center.totalItems}
                                            </p>
                                        </div>
                                        <div>
                                            <strong>
                                                Inventory Value
                                            </strong>
                                            <p>
                                                $
                                                {center.totalValue.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                <div className="pagination">
                    <button disabled>
                        &lt;
                    </button>
                    <span>
                        Page 1
                    </span>
                    <button disabled>
                        &gt;
                    </button>
                    <select defaultValue="20">
                        <option value="10">
                            10
                        </option>
                        <option value="20">
                            20
                        </option>
                        <option value="50">
                            50
                        </option>
                    </select>
                </div>
            </div>
        </main>
    )
}