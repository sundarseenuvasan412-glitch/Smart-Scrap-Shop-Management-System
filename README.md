# Scrap World

A responsive React storefront concept for browsing and enquiring about quality-checked scrap materials.

## Run locally

```sh
cd frontend
npm install
npm run dev
```

## Checks

```sh
cd frontend
npm run lint
npm test
npm run build
```

The homepage is focused on the showroom hero and scrap categories, with links to dedicated `/scrap-materials`, `/about-us` and `/contact` pages. The materials storefront includes category filters, material search, product detail galleries, weight selection and a client-side cart. Orders and enquiries are handed off to the visitor's email app; product data and cart contents are currently held in the browser session.

## Spring Boot backend

The Java 21+ / Spring Boot / MySQL backend is in [`backend`](./backend/README.md). See its README for MySQL setup, environment variables, and run instructions.

The backend README also documents the integrated JWT login and registration flow, Postman authentication test collection, and local test commands.

Set `VITE_API_BASE_URL` in the frontend environment when the API is not at its local default (`http://localhost:8080/api`).

## Project layout

```text
frontend/          React and Vite application
backend/           Spring Boot API and MySQL configuration
```
