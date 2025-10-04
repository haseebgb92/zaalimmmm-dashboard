# Zaalimmmm Shawarma Analytics Dashboard

A fully functional analytics dashboard for tracking daily sales and expenses for Zaalimmmm Shawarma. Built with Next.js 14, TypeScript, and modern web technologies.

## Features

### 📊 Dashboard
- **KPI Cards**: Gross Sales, Foodpanda Profit, Spot Sales, Orders, Expenses, Net Profit, Average Order Value
- **Interactive Charts**: Daily Net Profit, Sales by Source, Expenses by Category
- **Date Range Filters**: Today, Yesterday, This Week, Last Week, This Month, Custom Range
- **Real-time Updates**: KPIs and charts update automatically when data changes

### 📝 Daily Logs
- **Sales Management**: Track spot sales and Foodpanda sales with inline editing
- **Expense Tracking**: Comprehensive expense logging with categories and vendors
- **Quick Add Presets**: Pre-configured expense items for common purchases
- **Inline Editing**: Edit and delete entries directly from the table

### ⚙️ Settings
- **Business Configuration**: Adjust Foodpanda profit rate and currency
- **Import/Export**: CSV and JSON data import/export with templates
- **Data Management**: Backup and restore functionality

### 📱 Responsive Design
- **Mobile-First**: Fully responsive across all device sizes
- **Modern UI**: Clean, compact design with shadcn/ui components
- **Keyboard Navigation**: Accessible and keyboard-friendly interface

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Charts**: Chart.js with react-chartjs-2
- **Data Tables**: TanStack Table
- **Date Handling**: Day.js with Asia/Karachi timezone
- **Validation**: Zod

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Supabase recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/haseebgb92/zaalimmmm-dashboard.git
   cd zaalimmmm-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your database credentials:
   ```env
   POSTGRES_URL="your_postgres_connection_string"
   NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   # ... other environment variables
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed the database**
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Sales Table
- `id`: Unique identifier
- `date`: Date of sale (Asia/Karachi timezone)
- `source`: 'spot' or 'foodpanda'
- `orders`: Number of orders
- `gross_amount`: Gross sales amount
- `notes`: Additional notes

### Expenses Table
- `id`: Unique identifier
- `date`: Date of expense (Asia/Karachi timezone)
- `category`: Expense category
- `item`: Specific item (optional)
- `qty`: Quantity (optional)
- `unit`: Unit of measurement (optional)
- `unit_price`: Price per unit (optional)
- `amount`: Total amount
- `vendor`: Vendor name (optional)
- `notes`: Additional notes

### Settings Table
- `key`: Setting key
- `value`: Setting value

## Business Logic

### Profit Calculations
- **Foodpanda Profit**: `gross_amount × FP_PROFIT_RATE` (default 70%)
- **Spot Sales Profit**: `gross_amount` (100% profit)
- **Daily Net Profit**: `spot_sales + foodpanda_profit - daily_expenses`

### Date Handling
- All dates are stored in UTC but displayed in Asia/Karachi timezone
- Week starts on Monday (ISO week)
- Date filters respect Asia/Karachi timezone

## API Endpoints

### Summary
- `GET /api/summary?start=YYYY-MM-DD&end=YYYY-MM-DD` - Get KPIs and chart data

### Sales
- `GET /api/sales?start=&end=&source=` - Get sales data
- `POST /api/sales` - Create new sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Expenses
- `GET /api/expenses?start=&end=&category=` - Get expenses data
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Settings
- `GET /api/settings` - Get all settings
- `PUT /api/settings` - Update settings

### Export
- `GET /api/export?start=&end=&format=csv|json` - Export data

## Import/Export

### CSV Templates

**Sales Template:**
```csv
date,source,orders,gross_amount,notes
2025-01-01,spot,45,125000.00,"Evening rush"
2025-01-01,foodpanda,62,98000.00,"Rainy day"
```

**Expenses Template:**
```csv
date,category,item,vendor,qty,unit,unit_price,amount,notes
2025-01-01,Ingredients,Chicken,Metro,25,kg,620.00,15500.00,"Fresh"
2025-01-01,Bread,Bread Small,Bakery,60,packs,150.00,,"Auto compute"
```

### Validation Rules
- All dates must be in YYYY-MM-DD format
- Sales source must be 'spot' or 'foodpanda'
- Orders must be non-negative integers
- Amounts must be positive numbers
- CSV files must include header row

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the application: `npm run build`
2. Start the production server: `npm start`

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with default data

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for Zaalimmmm Shawarma