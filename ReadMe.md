
Technologies

Backend: Django, Django REST Framework, PostgreSQL
Frontend: Next.js, TypeScript, Tailwind CSS

Setup Instructions
Backend (Django)

Clone the repository

`git clone https://github.com/Saraahamrr/bulk-shipping-platform.git`

`cd project-name/backend`

Create a virtual environment

`python -m venv venv`
`source venv/bin/activate ` # Linux/macOS
`venv\Scripts\activate `    # Windows

Install dependencies

`pip install -r requirements.txt`

Create a .env file (see Environment Variables
)

Apply migrations

`python manage.py migrate`

Create a superuser (optional)

`python manage.py createsuperuser`

Run the server

`python manage.py runserver`

Backend should be running at: http://localhost:8000/

Frontend (Next.js)

Link Deployed   `https://bulk-shipping-platform.vercel.app`


Navigate to the frontend folder

`cd ../frontend`

Install dependencies

`npm install`



Create a .env.local file (see Environment Variables
)

Run the development server

`npm run dev`


Frontend should be running at: http://localhost:3000/

Environment Variables:

Backend (.env)
`DATABASE_URL=postgres://postgres:123@localhost:5432/shipping_db`

Frontend (.env.local)
`NEXT_PUBLIC_API_URL=http://localhost:8000/api`


