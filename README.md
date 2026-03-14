# CoreInventory - Odoo x Indus University Hackathon '26

![CoreInventory Header](https://via.placeholder.com/1200x400/0f172a/a855f7?text=CoreInventory+-+Hackathon+Edition)

CoreInventory is a sleek, high-performance, full-stack Inventory Management System designed specifically for the **Odoo x Indus University Hackathon 2026**. Built with a modern glassmorphic 'Tech' aesthetic, it allows warehouses and companies to completely manage their stock cycles with real-time analytics.

## ?? Features

* **Glassmorphic Tech UI:** Beautiful, responsive, dark-mode Tailwind dashboard.
* **Authentication:** Secure JWT-based Login/Signup flows. 
* **Product & SKU Management:** Auto-generate unique SKUs and manage inventory logic.
* **Warehouse Routing:** Setup multiple warehouses to manage deep distribution.
* **Stock Move Tracking:**
  * **Receipts:** Incoming stock deliveries.
  * **Delivery Orders:** Outgoing shipped materials.
  * **Internal Transfers:** Move item allocations between facilities seamlessly.
  * **Stock Adjustments:** Instantly resolve and track discrepancies.
* **Real-time Analytics:** Advanced Dashboard showing KPI metrics (Low stock, out-of-stock limits, dead stock tracking).

## ??? Tech Stack

### Frontend
* React.js (v19)
* Vite (Lightning Fast Build Tool)
* Tailwind CSS v4 (Custom animated utility classes)
* React Router v7 & Axios

### Backend
* Node.js & Express.js
* MongoDB (Mongoose Schema Architecture)
* JWT Authentication
* Bcrypt Password Hashing

## ?? Getting Started Locally

### 1. Clone the repository
\\\ash
git clone https://github.com/Kevaljo/Inventory-Management-System---Odoo-x-Indus-University-Hackathon-26.git
cd Inventory-Management-System---Odoo-x-Indus-University-Hackathon-26
\\\

### 2. Setup the Backend
\\\ash
cd backend
npm install
\\\
*Create a \.env\ file in the \/backend\ directory with your variables:*
\\\env
PORT=5000
MONGO_URI=your_mongodb_cluster_url
JWT_SECRET=your_super_secret_jwt_key
\\\
*Start the server:*
\\\ash
npm run dev
\\\

### 3. Setup the Frontend
*Open a new terminal window:*
\\\ash
cd frontend
npm install
\\\
*Specify API Route (optional if running locally via proxies, but useful for build)*
*Create \.env\ in \/frontend\:*
\\\env
VITE_API_URL=http://localhost:5000/api
\\\
*Start the Dashboard:*
\\\ash
npm run dev
\\\

## ?? Deployment

CoreInventory is pre-configured to be deployed easily!
* **Backend:** Ready for standard Node environments (Render, Railway).
* **Frontend:** Included \ercel.json\ sets up Vite React-Router catch-alls instantly for deployment onto Vercel.

---
*Built with ?? for the Odoo Hackathon 2026.*

