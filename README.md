# X Vizier 🔮

A Next.js analytics platform for X (Twitter) that helps creators understand what content performs best and why.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC?style=flat-square&logo=tailwind-css)

## What It Does

**X Vizier** provides two main capabilities:

### 1. Trending Topics Dashboard
Real-time display of the top 10 trending topics on X with metrics including tweet volume, impressions, and engagement rates.

### 2. Creator Analytics
Deep-dive analysis of any X account's content performance:
- **Posting Strategy**: Posts per day, best posting times, thread frequency
- **Engagement Metrics**: Average engagement, engagement rate, best-performing formats
- **Content Breakdown**: Distribution of threads vs single tweets vs replies, media usage impact
- **Top Posts Analysis**: Detailed breakdown of highest-performing content with engagement data
- **Big Engager Tracking**: See which high-follower accounts engaged with each post

## Personal Content Playbook

This repo also contains data-driven learnings from analyzing ~3 months of X content:

| Content Type | Avg Impressions | Notes |
|--------------|-----------------|-------|
| Personal Life (family, vulnerability) | 7,388 | Best performer |
| Announcements ("BREAKING", launches) | 5,959 | Strong |
| Alpha/Tips (insider info, actionable) | 4,824 | Solid |
| Long-form (200+ chars) | 3,890 | 2.3x better than short |
| General/Unthemed | 1,515 | Avoid |

**Best Days**: Sunday (4,988 avg) → Monday (3,343 avg)
**Worst Day**: Friday (2,781 avg)

### Winning Formulas
1. **Personal + Tech**: "I [life moment]. [Tech] made it [better]. Here's what happened..."
2. **Breaking Alpha**: "BREAKING - [Project] alpha. Sign up ASAP. [Why]..."
3. **Hot Take Defense**: "[Popular complaint] is wrong. Here's what people miss..."
4. **Announcement + CTA**: "I'm launching [thing]. Who wants to [action]?"
5. **Vulnerable Honesty**: "[Topic] is stigmatized. [Personal experience]..."

## Results: Content Assistant Impact

After building this content assistant, here's the week-over-week comparison:

| Metric | Week 1 (Jan 13-19) | Week 2 (Jan 20-27) | Change |
|--------|-------------------|-------------------|--------|
| Impressions | 212K | 309K | **+46%** |
| Bookmarks | 201 | 601 | **+199%** |
| New Followers | 140 | 172 | **+23%** |
| Engagements | 11.7K | 13.3K | +13% |
| Posts Created | 36 | 13 | -64% |
| Avg Impressions/Post | 1,807 | 10,199 | **+464%** |

**Key insight**: Posted 64% less, got 46% more impressions. Quality > quantity.

## Getting Started

### Prerequisites
- Node.js 18+
- X/Twitter API credentials
- (Optional) TweetScout API key for engager analysis

### Installation

```bash
# Clone the repository
git clone https://github.com/tut9492/TweetAnalyzer.git
cd TweetAnalyzer

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys
```

### Environment Variables

Create a `.env.local` file:

```env
TWITTER_API_KEY=your_twitter_api_key
TWEETSCOUT_API_KEY=your_tweetscout_api_key  # Optional
```

### Running the App

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3001](http://localhost:3001) to view the app.

## Project Structure

```
├── app/
│   ├── page.tsx              # Trending topics dashboard
│   ├── analyze/
│   │   └── page.tsx          # Creator analysis page
│   └── api/
│       ├── trending/         # Trending topics API
│       ├── analyze/          # Account analysis API
│       └── analyze-posts/    # Deep post analysis API
├── components/
│   ├── AccountAnalysis.tsx   # Account overview component
│   ├── PostsTable.tsx        # Sortable posts table with engagers
│   ├── PostCard.tsx          # Individual post display
│   └── SummaryStats.tsx      # Stats summary component
├── lib/
│   ├── twitter/              # Twitter API client & types
│   ├── tweetscout/           # TweetScout integration
│   ├── analysis/             # Post analysis logic
│   └── utils/                # Rate limiting, helpers
└── scripts/                  # Test scripts for APIs
```

## Data Files

Located in the `/data` folder:
- `account_overview_analytics.csv` - Daily account metrics (impressions, followers, etc.)
- `account_analytics_content_*.csv` - Post-level analytics export from X
- `X_Tweet_Analysis_Shane.xlsx` - Detailed analysis spreadsheet
- `X_Content_Playbook_Shane.docx` - Content strategy document
- `X_Content_Learnings*.md` - Quick reference for content rules

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trending` | GET | Top 10 trending topics with metrics |
| `/api/analyze?username=handle` | GET | Full account analysis |
| `/api/analyze-posts?username=handle` | GET | Deep post-level analysis |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **APIs**: Twitter API v2, TweetScout API

## Contributing

This is a personal analytics tool, but feel free to fork and adapt for your own use!

## License

MIT
