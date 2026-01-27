# X Vizier

A Next.js 14 application that displays the top 10 trending topics on X (Twitter) with detailed metrics.

## Features

- Real-time trending topics from X
- Tweet volume, impressions, and engagement metrics
- Auto-refresh every 5 minutes
- Clean, responsive UI with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
TWITTER_API_KEY=your_api_key_here
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
/app
  /api
    /trending
      route.ts          # API endpoint for trending topics
  page.tsx              # Main page component
  layout.tsx            # Root layout
  globals.css           # Global styles with Tailwind
/lib
  /twitter
    client.ts           # Twitter API client
```

## API Endpoints

- `GET /api/trending` - Returns top 10 trending topics with metrics

## Technologies

- Next.js 14
- TypeScript
- Tailwind CSS
- React 18

