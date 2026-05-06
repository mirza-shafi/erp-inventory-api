# QuantumERP - Inventory Management API

**🟢 Live Demo:** [https://erp-inventory-api-production.up.railway.app/](https://erp-inventory-api-production.up.railway.app/)

An enterprise-grade, production-ready Inventory Management API and Dashboard built for high performance and clean architecture.

## 🚀 Features

### Backend (API)
- **FastAPI (Async):** High-performance asynchronous API.
- **PostgreSQL & asyncpg:** Robust relational database management with async driver.
- **SQLAlchemy 2.0:** Modern ORM with async session management.
- **Pydantic V2:** Strict data validation and schema definitions.
- **Clean Architecture:** Layered design out-of-the-box (routers, services, schemas, models).
- **CRUD Operations:** Complete Create, Read, Update, Delete for products.
- **Business Logic:** Dedicated endpoint for low-stock flagging and alerting.

### Frontend (SPA Dashboard)
- **Vue 3 (Composition API):** Reactive, state-driven single-page application.
- **Tailwind CSS:** Utility-first styling for a beautiful, modern interface.
- **Data Analytics:** Dynamic Doughnut charts via Chart.js.
- **Advanced Grid:** Click-to-sort columns, live search, and category filtering.
- **Export Functionality:** Export current dataset context seamlessly to CSV.
- **Responsive UX:** Glassmorphism UI, toast notifications, animated modals, and visual health indicators.

## 🛠 Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, SQLAlchemy, PostgreSQL.
- **Frontend:** HTML5, Tailwind CSS, Vue 3, Axios, Chart.js, FontAwesome.

## 📂 Project Structure

```text
erp-inventory-api/
├── app/
│   ├── api/          # API Routers & Dependencies
│   ├── core/         # Environment & Settings configs
│   ├── db/           # Async Engine & Session setups
│   ├── models/       # SQLAlchemy Database Models
│   ├── schemas/      # Pydantic validation schemas
│   ├── services/     # Business logic layer
│   ├── utils/        # Helpers and Logger
│   ├── main.py       # FastAPI application instance
├── frontend/         # Vue 3 SPA Dashboard files
│   ├── index.html
│   ├── app.js
├── .env.example      # Environment variables template
├── requirements.txt  # Python dependencies
└── README.md
```

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mirza-shafi/erp-inventory-api.git
   cd erp-inventory-api
   ```

2. **Set up a Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Configuration:**
   - Ensure PostgreSQL is installed and running.
   - Create a database (e.g., `erp_inventory`).
   - Copy the environment variables:
     ```bash
     cp .env.example .env
     ```
   - Update `.env` with your actual Postgres credentials.

5. **Run the Application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## 🌐 Usage

### Live Production
- **Dashboard UI:** [https://erp-inventory-api-production.up.railway.app/](https://erp-inventory-api-production.up.railway.app/)
- **Swagger API Docs:** [https://erp-inventory-api-production.up.railway.app/docs](https://erp-inventory-api-production.up.railway.app/docs)

### Local Development
- **Dashboard UI:** Navigate to `http://localhost:8000/` in your browser.
- **Swagger API Docs:** Navigate to `http://localhost:8000/docs`.
- **ReDoc API Docs:** Navigate to `http://localhost:8000/redoc`.

