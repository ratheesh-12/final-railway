# 📊 Dashboard Analytics API Documentation

## Base URL
```
http://localhost:YOUR_PORT/api/analytics
```

---

## 📈 API Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/dashboard/stats` | GET | Get overall dashboard statistics |
| `/dashboard/monthly-revenue` | GET | Get monthly revenue chart data |
| `/dashboard/daily-revenue` | GET | Get daily revenue for a month |
| `/dashboard/top-workers` | GET | Get top performing workers |
| `/dashboard/recent-bookings` | GET | Get recent bookings list |
| `/dashboard/payment-analytics` | GET | Get payment method analytics |

---

## 1️⃣ Get Dashboard Stats

**Endpoint:** `GET /api/analytics/dashboard/stats`

**Description:** Returns comprehensive dashboard overview including revenue, bookings, completed count, category breakdown, and active bookings.

### Request
```http
GET /api/analytics/dashboard/stats
```

### Response (200 - Success)
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "revenue": {
      "total": 45000,
      "current_month": 12000,
      "last_month": 10000,
      "percentage_change": 20.00,
      "trend": "up"
    },
    "bookings": {
      "total": 60,
      "today": 5,
      "yesterday": 3,
      "change": 2,
      "trend": "up"
    },
    "completed": {
      "total": 18,
      "current_month": 15,
      "last_month": 12,
      "percentage_change": 25.00,
      "trend": "up"
    },
    "top_category": {
      "sitting": {
        "count": 30,
        "revenue": 6000,
        "percentage": 50.00
      },
      "sleeper": {
        "count": 30,
        "revenue": 6000,
        "percentage": 50.00
      },
      "total_count": 60
    },
    "active_bookings": {
      "sitting": {
        "count": 42,
        "persons": 85,
        "capacity": 50
      },
      "sleeper": {
        "count": 42,
        "persons": 90,
        "capacity": 50
      }
    }
  }
}
```

### Use Cases
- **Dashboard Header:** Display total revenue with trend
- **Booking Cards:** Show total and completed bookings
- **Category Pie Chart:** Display sitting vs sleeper distribution
- **Capacity Tracking:** Show active bookings count

---

## 2️⃣ Get Monthly Revenue

**Endpoint:** `GET /api/analytics/dashboard/monthly-revenue`

**Description:** Returns monthly revenue data for chart visualization.

### Request
```http
GET /api/analytics/dashboard/monthly-revenue?year=2025&months=6
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `year` | Integer | No | Current year | Year to fetch data for |
| `months` | Integer | No | 6 | Number of months to return |

### Response (200 - Success)
```json
{
  "message": "Monthly revenue data retrieved successfully",
  "year": 2025,
  "data": [
    {
      "month": "January",
      "month_number": 1,
      "year": 2025,
      "total_revenue": 8500,
      "sitting_revenue": 4200,
      "sleeper_revenue": 4300,
      "total_bookings": 45,
      "sitting_bookings": 22,
      "sleeper_bookings": 23,
      "paid_amount": 7500
    },
    {
      "month": "February",
      "month_number": 2,
      "year": 2025,
      "total_revenue": 9200,
      "sitting_revenue": 4800,
      "sleeper_revenue": 4400,
      "total_bookings": 50,
      "sitting_bookings": 25,
      "sleeper_bookings": 25,
      "paid_amount": 8500
    },
    {
      "month": "March",
      "month_number": 3,
      "year": 2025,
      "total_revenue": 7800,
      "sitting_revenue": 3900,
      "sleeper_revenue": 3900,
      "total_bookings": 40,
      "sitting_bookings": 20,
      "sleeper_bookings": 20,
      "paid_amount": 7200
    },
    {
      "month": "April",
      "month_number": 4,
      "year": 2025,
      "total_revenue": 10500,
      "sitting_revenue": 5500,
      "sleeper_revenue": 5000,
      "total_bookings": 55,
      "sitting_bookings": 28,
      "sleeper_bookings": 27,
      "paid_amount": 9800
    },
    {
      "month": "May",
      "month_number": 5,
      "year": 2025,
      "total_revenue": 8900,
      "sitting_revenue": 4400,
      "sleeper_revenue": 4500,
      "total_bookings": 48,
      "sitting_bookings": 24,
      "sleeper_bookings": 24,
      "paid_amount": 8200
    },
    {
      "month": "June",
      "month_number": 6,
      "year": 2025,
      "total_revenue": 9100,
      "sitting_revenue": 4600,
      "sleeper_revenue": 4500,
      "total_bookings": 52,
      "sitting_bookings": 26,
      "sleeper_bookings": 26,
      "paid_amount": 8700
    }
  ]
}
```

### Use Cases
- **Revenue Chart:** Display monthly revenue trends (Jan-Jun bar chart as shown in Figma)
- **Comparison:** Compare sitting vs sleeper revenue
- **Forecasting:** Analyze revenue patterns

---

## 3️⃣ Get Daily Revenue

**Endpoint:** `GET /api/analytics/dashboard/daily-revenue`

**Description:** Returns daily revenue breakdown for a specific month.

### Request
```http
GET /api/analytics/dashboard/daily-revenue?month=10&year=2025
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | Integer (1-12) | No | Current month | Month to fetch data for |
| `year` | Integer | No | Current year | Year to fetch data for |

### Response (200 - Success)
```json
{
  "message": "Daily revenue data retrieved successfully",
  "month": 10,
  "year": 2025,
  "data": [
    {
      "day": 1,
      "date": "2025-10-01",
      "total_revenue": 450,
      "sitting_revenue": 200,
      "sleeper_revenue": 250,
      "total_bookings": 3
    },
    {
      "day": 2,
      "date": "2025-10-02",
      "total_revenue": 600,
      "sitting_revenue": 300,
      "sleeper_revenue": 300,
      "total_bookings": 4
    },
    {
      "day": 3,
      "date": "2025-10-03",
      "total_revenue": 350,
      "sitting_revenue": 150,
      "sleeper_revenue": 200,
      "total_bookings": 2
    }
    // ... continues for all days in the month
  ]
}
```

### Use Cases
- **Daily Tracking:** Monitor day-by-day performance
- **Peak Detection:** Identify busiest days
- **Detailed Analytics:** Drill down from monthly to daily view

---

## 4️⃣ Get Top Workers

**Endpoint:** `GET /api/analytics/dashboard/top-workers`

**Description:** Returns top performing workers based on bookings handled.

### Request
```http
GET /api/analytics/dashboard/top-workers?limit=10&month=10&year=2025
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | Integer | No | 10 | Number of workers to return |
| `month` | Integer (1-12) | No | All time | Filter by specific month |
| `year` | Integer | No | All time | Filter by specific year |

### Response (200 - Success)
```json
{
  "message": "Top workers retrieved successfully",
  "count": 5,
  "data": [
    {
      "worker_id": "WOR001",
      "full_name": "Rajesh Kumar",
      "mobile_number": "9876543210",
      "total_bookings": 45,
      "total_revenue": 9500,
      "completed_bookings": 40,
      "active_bookings": 5
    },
    {
      "worker_id": "WOR002",
      "full_name": "Priya Sharma",
      "mobile_number": "9876543211",
      "total_bookings": 38,
      "total_revenue": 8200,
      "completed_bookings": 35,
      "active_bookings": 3
    },
    {
      "worker_id": "WOR003",
      "full_name": "Amit Patel",
      "mobile_number": "9876543212",
      "total_bookings": 32,
      "total_revenue": 7100,
      "completed_bookings": 30,
      "active_bookings": 2
    },
    {
      "worker_id": "WOR004",
      "full_name": "Sunita Reddy",
      "mobile_number": "9876543213",
      "total_bookings": 28,
      "total_revenue": 6400,
      "completed_bookings": 26,
      "active_bookings": 2
    },
    {
      "worker_id": "WOR005",
      "full_name": "Vikram Singh",
      "mobile_number": "9876543214",
      "total_bookings": 25,
      "total_revenue": 5800,
      "completed_bookings": 23,
      "active_bookings": 2
    }
  ]
}
```

### Use Cases
- **Performance Tracking:** Identify top performers
- **Incentive Calculation:** Reward based on performance
- **Resource Allocation:** Assign tasks to efficient workers

---

## 5️⃣ Get Recent Bookings

**Endpoint:** `GET /api/analytics/dashboard/recent-bookings`

**Description:** Returns recent bookings for dashboard display.

### Request
```http
GET /api/analytics/dashboard/recent-bookings?limit=10&status=active
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | Integer | No | 10 | Number of bookings to return |
| `status` | String | No | All | Filter by status: `active`, `completed` |

### Response (200 - Success)
```json
{
  "message": "Recent bookings retrieved successfully",
  "count": 6,
  "data": [
    {
      "booking_id": "#1223",
      "guest_name": "Alex Fisher",
      "phone_number": "+91 902 543 3001",
      "number_of_persons": 3,
      "booking_type": "sleeper",
      "booking_date": "2025-10-10T00:00:00.000Z",
      "in_time": "14:30:00",
      "out_time": "17:30:00",
      "total_amount": 900,
      "paid_amount": 900,
      "balance_amount": 0,
      "booking_status": "completed",
      "created_at": "2025-10-10T08:30:00.000Z",
      "worker_name": "Rajesh Kumar",
      "admin_name": "Admin Name"
    },
    {
      "booking_id": "#1224",
      "guest_name": "Anna Baker",
      "phone_number": "+91 902 543 3001",
      "number_of_persons": 5,
      "booking_type": "sitting",
      "booking_date": "2025-10-10T00:00:00.000Z",
      "in_time": "10:00:00",
      "out_time": "15:00:00",
      "total_amount": 1250,
      "paid_amount": 1250,
      "balance_amount": 0,
      "booking_status": "active",
      "created_at": "2025-10-10T09:15:00.000Z",
      "worker_name": "Priya Sharma",
      "admin_name": "Admin Name"
    }
    // ... more bookings
  ]
}
```

### Use Cases
- **Booking List Table:** Display on dashboard (as shown in Figma)
- **Quick Access:** View recent transactions
- **Status Monitoring:** Track active vs completed bookings

---

## 6️⃣ Get Payment Analytics

**Endpoint:** `GET /api/analytics/dashboard/payment-analytics`

**Description:** Returns payment method breakdown and collection analytics.

### Request
```http
GET /api/analytics/dashboard/payment-analytics?month=10&year=2025
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `month` | Integer (1-12) | No | Current month | Month to analyze |
| `year` | Integer | No | Current year | Year to analyze |

### Response (200 - Success)
```json
{
  "message": "Payment analytics retrieved successfully",
  "month": 10,
  "year": 2025,
  "summary": {
    "total_transactions": 60,
    "total_paid": 42000,
    "total_amount": 45000,
    "total_balance": 3000,
    "collection_rate": 93.33
  },
  "payment_methods": {
    "cash": {
      "count": 35,
      "paid": 24500,
      "total": 26000,
      "balance": 1500,
      "percentage": 58.33
    },
    "card": {
      "count": 15,
      "paid": 10500,
      "total": 11000,
      "balance": 500,
      "percentage": 25.00
    },
    "upi": {
      "count": 10,
      "paid": 7000,
      "total": 8000,
      "balance": 1000,
      "percentage": 16.67
    }
  }
}
```

### Use Cases
- **Payment Tracking:** Monitor payment method usage
- **Collection Rate:** Track payment collection efficiency
- **Financial Planning:** Understand cash flow patterns

---

## 🎯 Integration Examples

### Example 1: Dashboard Overview Component
```javascript
// Fetch all dashboard data
async function loadDashboard() {
  try {
    // Main stats
    const stats = await fetch('/api/analytics/dashboard/stats');
    const statsData = await stats.json();
    
    // Monthly revenue for chart
    const revenue = await fetch('/api/analytics/dashboard/monthly-revenue?months=6');
    const revenueData = await revenue.json();
    
    // Recent bookings
    const bookings = await fetch('/api/analytics/dashboard/recent-bookings?limit=10');
    const bookingsData = await bookings.json();
    
    // Update UI with data
    updateDashboard(statsData, revenueData, bookingsData);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}
```

### Example 2: Revenue Card Display
```javascript
// Display revenue with trend
function displayRevenueCard(revenueData) {
  const { total, percentage_change, trend } = revenueData;
  
  return `
    <div class="revenue-card">
      <h3>Total Revenue</h3>
      <p class="amount">₹ ${total.toLocaleString()}</p>
      <p class="trend ${trend}">
        ${trend === 'up' ? '↑' : '↓'} ${Math.abs(percentage_change)}% from last month
      </p>
    </div>
  `;
}
```

### Example 3: Category Pie Chart
```javascript
// Create pie chart data
function createCategoryChart(topCategory) {
  const { sitting, sleeper } = topCategory;
  
  const chartData = {
    labels: ['Sitting', 'Sleeper'],
    datasets: [{
      data: [sitting.percentage, sleeper.percentage],
      backgroundColor: ['#4A90E2', '#F5A623'],
      label: 'Booking Type Distribution'
    }]
  };
  
  return chartData;
}
```

---

## 🔒 Error Responses

All endpoints may return the following error:

### 500 - Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## 📝 Notes

1. **Date Formats:** All dates are returned in ISO 8601 format
2. **Numeric Precision:** Revenue amounts are returned with 2 decimal places
3. **Percentages:** All percentage values are calculated to 2 decimal places
4. **Time Zone:** All timestamps are in UTC with timezone offset
5. **Empty Data:** Returns 0 values if no data available for the period

---

## 🚀 Quick Start

1. Start your backend server
2. Test the main dashboard endpoint:
```bash
curl http://localhost:YOUR_PORT/api/analytics/dashboard/stats
```

3. Integrate the responses in your frontend dashboard components

---

**Created for Railway Booking System Dashboard** 🚆
