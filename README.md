# rawr

A magazine built on the taste of one man.
It may be subjective and biased, and that is not denied.
In an age of excess information, we hope personal taste can still reach the world.

**Live site:** [rawr.co.kr](https://rawr.co.kr)

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS — deployed on Vercel
- **Backend:** Spring Boot (Java), JPA/Hibernate, Flyway — deployed on AWS EC2
- **Database:** PostgreSQL on AWS RDS
- **Auth:** JWT + Kakao OAuth

## Project Structure

```
rawr/
├── rawr-frontend/       # Next.js app
│   ├── app/             # pages (shop, about, [category], articles, etc.)
│   ├── components/      # shared UI
│   └── lib/             # api client
└── rawr-backend/        # Spring Boot app
    └── src/main/java/com/rawr/
        ├── article/     # articles & categories
        ├── auth/        # JWT, OAuth
        ├── bookmark/    # bookmarks
        └── user/        # user accounts
```

## Features

- Article browsing by category (FASHION)
- Search
- Bookmarks (requires login)
- Kakao OAuth sign-in
- SHOP — products linked to Naver SmartStore

## Development

### Frontend

```bash
cd rawr-frontend
npm install
npm run dev
```

### Backend

```bash
cd rawr-backend
./gradlew bootRun
```
