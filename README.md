# School Management System (Multi-Tenant)

A comprehensive, enterprise-grade School Management System built with modern web technologies. This system supports multiple schools (multi-tenancy) with strict data isolation, role-based access control, and a wide range of academic and administrative modules.

## 🏗️ Technical Architecture

### **Frontend**
*   **Framework:** React 18 (Vite)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Lucide Icons
*   **State Management:** React Context API
*   **Charts:** Recharts
*   **Printing:** React-to-Print

### **Backend & Database**
*   **Database Engine:** **PostgreSQL** (via Supabase)
    *   Uses standard SQL for all data operations.
    *   Relational schema with Foreign Keys and Constraints.
    *   **Row Level Security (RLS):** Native PostgreSQL security policies enforce data isolation between schools and roles.
*   **Authentication:** Supabase Auth (JWT based).
*   **Storage:** Supabase Storage (for documents and images).
*   **API:** PostgREST (Auto-generated RESTful API over PostgreSQL).

## 🔐 Security Features
*   **Multi-Tenancy:** Single database serving multiple schools. Data is isolated using `school_id` columns and enforced via RLS policies at the database level.
*   **RBAC:** Role-Based Access Control for System Admins, School Admins, Teachers, Students, Parents, and Cashiers.
*   **Audit Logging:** Comprehensive tracking of all critical system actions.

## 📦 Modules

1.  **Dashboard:** Role-specific analytics and KPIs.
2.  **Academics:**
    *   Class & Section Management
    *   Subject & Course Management
    *   Timetable & Lesson Planning
    *   Homework & Assignments
3.  **People:**
    *   Student Admission (with 360° Profile)
    *   Teacher/Staff Management
    *   Parent Access
4.  **Examinations:**
    *   Exam Scheduling
    *   Grading (GPA/CCE support)
    *   Report Cards & Transcripts
    *   Online Computer-Based Testing
5.  **Finance:**
    *   Fee Structure & Collection
    *   Income & Expense Tracking
    *   Payroll Management
6.  **Operations:**
    *   Library Management
    *   Inventory & Stock
    *   Transport & Routes
    *   Hostel & Room Allocation
    *   Front Office (Enquiries, Visitors)
7.  **Communication:**
    *   Noticeboard
    *   Internal Messaging
    *   Events Calendar

## 🚀 Getting Started

1.  **Install Dependencies:**
    ```bash
    yarn install
    ```

2.  **Environment Setup:**
    Ensure your `.env` file contains valid Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

3.  **Run Development Server:**
    ```bash
    yarn run dev
    ```

4.  **Build for Production:**
    ```bash
    yarn run build
    ```

## 🗄️ Database Schema

The database is structured in the `public` schema of PostgreSQL. Key tables include:
*   `schools`: Tenant configurations.
*   `profiles`: User profiles linked to Auth.
*   `students`, `teachers`: Core user data.
*   `classes`, `sections`, `courses`: Academic structure.
*   `fees`, `payments`, `expenses`: Financial records.
*   `grades`, `exams`: Academic results.

*Powered by Dualite Alpha*
