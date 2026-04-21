# BCMIS Codebase Summary

This document provides a simplified overview of the **Butuan City Market Information System (BCMIS)** codebase.

## 🏗️ 1. Architecture (How it's built)
The application is built using **Next.js (App Router)** and **Supabase**.

- **Frontend:** React components located in `/components`.
- **Pages/Routes:** Defined in the `/app` directory.
- **Database Logic:** Located in `/lib`.
  - `/lib/supabase`: Connection and configuration.
  - `/lib/actions`: Server-side functions that **change** data (mutations).
  - `/lib/queries`: Server-side functions that **read** data.

---

## 🔐 2. Core Setup: Supabase
The app talks to the database through a central client.

- **File:** `lib/supabase/server.ts`
- **Key Function:** `createClient()`
- **Use:** It manages the connection to Supabase. It automatically handles "cookies" so the system knows which user is currently logged in without them having to re-login on every page.

---

## ⚡ 3. Key Actions (The Logic)

### 🔑 Authentication (`lib/actions/auth.ts`)
Handles everything related to user security.
- `changePassword`: Allows a logged-in user to update their credentials.
- `initiatePasswordReset`: Sends an email to users who forgot their password.
- `verifyOtpAndChangePassword`: Handles security codes (One-Time Passwords).

### 🏪 Vendor Operations (`lib/actions/vendor.ts`)
This is the "heart" of the market management.
- `addListing`: Creates a new product entry for a vendor.
- `updateListingPrice`: Updates price and **automatically logs it** to `price_history` for trend analysis.
- `updateVendorProfile`: Updates business details like opening/closing hours.
- `seedInitialCatalog`: A setup tool to populate the system with default categories (Meat, Vegetables, etc.).

---

## 📂 4. The File Structure Explained

| Directory | Purpose |
| :--- | :--- |
| `/app` | The "What you see" part. Each folder is a URL link. |
| `/components` | Small building blocks (Buttons, Forms, Navigation). |
| `/lib/actions` | "Verbs" — where the magic happens (Add, Delete, Update). |
| `/lib/queries` | "Questions" — asking the database for info. |
| `/lib/utils` | General tools like date formatting or currency converters. |

---

## 💡 5. Main Concepts to Remember

1.  **The Master Catalog:** Products are defined once in a "Master Catalog" (`products` table).
2.  **Price Listings:** A "Listing" is when a specific **Vendor** sells a product from the master catalog at a specific **Price** in a specific **Market**.
3.  **Real-time Updates:** The app uses `revalidatePath` after actions to make sure the user sees the latest data immediately without refreshing the page.

---

## 🏷️ 6. Common Variables
- `supabase`: The main tool for talking to the database.
- `vendor_id`: The unique ID of the seller.
- `listing_id`: The ID of a specific product being sold.
- `market_id`: The ID of the physical location (e.g., Central Market).
