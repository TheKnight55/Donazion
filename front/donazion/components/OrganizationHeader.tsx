"use client"

import { useRouter } from "next/navigation"

export default function OrganizationHeader() {

    const router = useRouter()

    return (
        <header className="org-header">

            <div className="org-title">
                <h1>Donazion</h1>
                <span>Organization</span>
            </div>

            <div className="org-navigation">

                <button
                    onClick={() => router.push("/organization")}
                >
                    Dashboard
                </button>

                <button>
                    Change Password
                </button>

                <button
                    onClick={() =>
                        router.push("/organization/donation-centers")
                    }
                >
                    List Donation Centers
                </button>

            </div>

        </header>
    )
}