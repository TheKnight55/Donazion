"use client"
import { useRouter } from "next/navigation"
import OrganizationHeader from "../../components/OrganizationHeader"
import styles from "./page.module.css";

export default function OrganizationDashboard() {
    const router = useRouter()
    return (
        <main>
            <OrganizationHeader />
            <div className="dashboard">
                <h2>Organization Dashboard</h2>
                <div className="dashboard-buttons">
                    <button onClick={() =>router.push("/organization/donation-centers")}>List Donation Centers</button>
                </div>
                <section className="categories">
                    <h2>Categories</h2>
                    <div className="category">
                        <div className="category-header">
                            <button>Remove Category</button>
                        </div>
                        <div className="category-item">
                            <div>
                                
                            </div>
                            <div className="item-buttons">
                                <button>Edit Category Item</button>
                                <button>Remove Category Item</button>
                            </div>
                        </div>
                        <button>Add Category Item</button>
                    </div>
                    <div className="category">
                        <div className="category-header">
                            <h3>Vehicles</h3>
                            <button>Remove Category</button>
                        </div>
                        <button>Upload Category Items</button>
                        <button>Add Category Item</button>
                    </div>
                    <input className="category"></input>
                    <button className="addCategory ">Add Category</button>
                </section>
            </div>
        </main>
    )
}