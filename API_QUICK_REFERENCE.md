# 🚀 Quick API Reference - Dashboard Endpoints

## Base URL: `/api/analytics`

---

## 1. Dashboard Stats
```
GET /api/analytics/dashboard/stats
```
**Returns:** Revenue, bookings, completed, categories, active count

---

## 2. Monthly Revenue
```
GET /api/analytics/dashboard/monthly-revenue?year=2025&months=6
```
**Query Params:**
- `year` (optional) - Default: current year
- `months` (optional) - Default: 6

**Returns:** Monthly revenue breakdown for chart

---

## 3. Daily Revenue
```
GET /api/analytics/dashboard/daily-revenue?month=10&year=2025
```
**Query Params:**
- `month` (optional) - Default: current month
- `year` (optional) - Default: current year

**Returns:** Daily revenue for the month

---

## 4. Top Workers
```
GET /api/analytics/dashboard/top-workers?limit=10&month=10&year=2025
```
**Query Params:**
- `limit` (optional) - Default: 10
- `month` (optional) - Filter by month
- `year` (optional) - Filter by year

**Returns:** Top performing workers list

---

## 5. Recent Bookings
```
GET /api/analytics/dashboard/recent-bookings?limit=10&status=active
```
**Query Params:**
- `limit` (optional) - Default: 10
- `status` (optional) - Values: `active`, `completed`

**Returns:** Recent bookings list

---

## 6. Payment Analytics
```
GET /api/analytics/dashboard/payment-analytics?month=10&year=2025
```
**Query Params:**
- `month` (optional) - Default: current month
- `year` (optional) - Default: current year

**Returns:** Payment method breakdown and collection rate

---

## 📋 Testing Commands

### Using cURL:
```bash
# Dashboard Stats
curl http://localhost:3000/api/analytics/dashboard/stats

# Monthly Revenue
curl http://localhost:3000/api/analytics/dashboard/monthly-revenue

# Daily Revenue
curl http://localhost:3000/api/analytics/dashboard/daily-revenue

# Top Workers
curl http://localhost:3000/api/analytics/dashboard/top-workers

# Recent Bookings
curl http://localhost:3000/api/analytics/dashboard/recent-bookings

# Payment Analytics
curl http://localhost:3000/api/analytics/dashboard/payment-analytics
```

### Using JavaScript:
```javascript
// Dashboard Stats
const stats = await fetch('/api/analytics/dashboard/stats').then(r => r.json());

// Monthly Revenue
const revenue = await fetch('/api/analytics/dashboard/monthly-revenue?months=6').then(r => r.json());

// Recent Bookings
const bookings = await fetch('/api/analytics/dashboard/recent-bookings?limit=10').then(r => r.json());
```

---

## 🎯 Common Use Cases

### Loading Complete Dashboard:
```javascript
async function loadDashboard() {
  const [stats, revenue, bookings] = await Promise.all([
    fetch('/api/analytics/dashboard/stats').then(r => r.json()),
    fetch('/api/analytics/dashboard/monthly-revenue').then(r => r.json()),
    fetch('/api/analytics/dashboard/recent-bookings').then(r => r.json())
  ]);
  
  return { stats: stats.data, revenue: revenue.data, bookings: bookings.data };
}
```

### Filtering by Date:
```javascript
// Get October 2025 data
const october = await fetch('/api/analytics/dashboard/daily-revenue?month=10&year=2025').then(r => r.json());

// Get last 12 months
const yearly = await fetch('/api/analytics/dashboard/monthly-revenue?months=12').then(r => r.json());
```

---

**All endpoints are ready to use!** ✅
