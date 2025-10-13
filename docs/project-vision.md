### Project Vision: Budget Buddy

#### Project Overview

This project is a full-stack application for tracking monthly expenses. It is designed to allow a user to enter, view, edit, and save categorized expense data, organized by year and month. The system should be simple, intuitive, and built using modern technologies: a React frontend, an Express and TypeScript backend, and a MongoDB database.

#### Frontend Description

The frontend should be built using React and should provide a user-friendly interface for managing monthly expenses. The main features of the frontend include:

- A dropdown to select the year (for example, between 2024 and 2026).
- A dropdown to select the month (1 to 12).
- A table that displays the user's expenses organized into multiple predefined categories. The categories are as follows:
  - Housing
  - Food
  - Transportation
  - Hobbies
  - OneTime
- Each category contains multiple subcategories (or line items), each with an associated numeric value representing the amount spent.
- For the "OneTime" category, there must be a button that allows the user to dynamically add new subcategories, since this category includes flexible and unstructured expenses that change month to month.
- Each cell in the table should be editable to allow changing the amount spent in any given subcategory.
- A button at the bottom of the interface allows the user to save all changes.
- When the selected month or year changes, the application should send a request to load the relevant data for that period.
- Axios will be used to send GET and POST requests to the backend.
- When the page loads, the app should automatically request the data for the current month and year.

#### Backend Description

The backend should be built using Node.js, Express, and TypeScript. It will expose two main API endpoints:

- A GET endpoint at `/api/expenses` that accepts query parameters `year` and `month` and returns the expense data for that specific year and month. If no data exists for the requested time period, the endpoint should return a new blank structure with all the categories defined and empty subcategories.
- A POST endpoint at `/api/expenses` that accepts a full payload including the year, month, and category data and saves it to the database. If a record already exists for that year and month, it should be updated. If not, a new one should be created.

The backend should also connect to MongoDB and define a schema for storing the data.

#### Database Schema

The MongoDB schema should be defined using Mongoose and written in TypeScript. The structure of the data is as follows:

- `year`: number
- `month`: number
- `categories`: an object where each key is a category name (such as Housing, Food, etc.), and each value is an object that maps subcategory names (strings) to their amounts (numbers)

This means that the data is flexible: within each category, subcategories can vary. This is especially important for the "OneTime" category, where new subcategories may be created each month.

The schema should include a unique index on the combination of `year` and `month`, to prevent duplicate entries and to allow fast lookups.

#### System Behavior Summary

- On page load, the frontend automatically sends a GET request for the current year and month.
- If expense data exists for that period, the backend returns it and the table is populated.
- If no data exists, the backend returns a default template with empty category structures.
- The user can edit the values directly in the table.
- The user can add new subcategories under "OneTime".
- When finished, the user clicks "Save", which sends a POST request to the backend to either insert or update the data in MongoDB.
- The user can navigate to any other month or year using the dropdowns, triggering a GET request for that selection.

#### Technical Requirements Summary

Frontend:

- Built using React
- Uses Axios for API requests
- State management using `useState` and `useEffect`
- Minimal styling (can be basic HTML and CSS for now)
- Support for dynamic table rows in the "OneTime" category
- Year and month selectors
- Editable inputs for amounts
- Save button to persist data

Backend:

- Built using Node.js, Express, and TypeScript
- Two endpoints: `GET /api/expenses` and `POST /api/expenses`
- Uses Mongoose to connect to MongoDB
- Implements schema with a flexible `categories` structure
- Applies a unique index on `year` and `month` to prevent duplicates

Database:

- MongoDB
- One collection called `expenses`
- Each document stores `year`, `month`, and nested expense data
- Flexible subcategories supported within each category

#### Notes

This description is the authoritative source of the project's intent. Variations like using Next.js instead of React or NestJS instead of Express are acceptable as long as they adhere to the behaviors and data contracts described here.
