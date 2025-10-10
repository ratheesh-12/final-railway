// Packages
const db = require("../config/db.js");

// ==================== DASHBOARD ANALYTICS ====================

// Get Dashboard Overview Statistics
const getDashboardStats = async (req, res) => {
  const client = await db.connect();
  try {
    // Get current date info
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // 1. Total Revenue (all time and current month)
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = $1 
          AND EXTRACT(YEAR FROM created_at) = $2 
          THEN total_amount 
          ELSE 0 
        END), 0) as current_month_revenue,
        COALESCE(SUM(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = $3 
          AND EXTRACT(YEAR FROM created_at) = $4 
          THEN total_amount 
          ELSE 0 
        END), 0) as last_month_revenue
      FROM bookings;
    `;
    const { rows: revenueData } = await client.query(revenueQuery, [
      currentMonth,
      currentYear,
      lastMonth,
      lastMonthYear,
    ]);

    // Calculate revenue percentage change
    const currentMonthRevenue = parseFloat(revenueData[0].current_month_revenue);
    const lastMonthRevenue = parseFloat(revenueData[0].last_month_revenue);
    let revenuePercentageChange = 0;
    
    if (lastMonthRevenue > 0) {
      revenuePercentageChange = ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      revenuePercentageChange = 100;
    }

    // 2. Total Bookings (all time, current month, last month)
    const bookingsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = $1 
          AND EXTRACT(YEAR FROM created_at) = $2 
          THEN 1 
        END) as current_month_bookings,
        COUNT(CASE 
          WHEN EXTRACT(MONTH FROM created_at) = $3 
          AND EXTRACT(YEAR FROM created_at) = $4 
          THEN 1 
        END) as last_month_bookings,
        COUNT(CASE 
          WHEN EXTRACT(DAY FROM created_at) = EXTRACT(DAY FROM CURRENT_DATE) - 1
          AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          THEN 1 
        END) as yesterday_bookings
      FROM bookings;
    `;
    const { rows: bookingsData } = await client.query(bookingsQuery, [
      currentMonth,
      currentYear,
      lastMonth,
      lastMonthYear,
    ]);

    // Calculate bookings change (from last day)
    const todayBookingsQuery = `
      SELECT COUNT(*) as today_bookings
      FROM bookings
      WHERE DATE(created_at) = CURRENT_DATE;
    `;
    const { rows: todayData } = await client.query(todayBookingsQuery);
    const todayBookings = parseInt(todayData[0].today_bookings);
    const yesterdayBookings = parseInt(bookingsData[0].yesterday_bookings);
    const bookingsChange = todayBookings - yesterdayBookings;

    // 3. Completed Bookings (current month and last month)
    const completedQuery = `
      SELECT 
        COUNT(*) as total_completed,
        COUNT(CASE 
          WHEN EXTRACT(MONTH FROM updated_at) = $1 
          AND EXTRACT(YEAR FROM updated_at) = $2 
          THEN 1 
        END) as current_month_completed,
        COUNT(CASE 
          WHEN EXTRACT(MONTH FROM updated_at) = $3 
          AND EXTRACT(YEAR FROM updated_at) = $4 
          THEN 1 
        END) as last_month_completed
      FROM bookings
      WHERE booking_status = 'completed';
    `;
    const { rows: completedData } = await client.query(completedQuery, [
      currentMonth,
      currentYear,
      lastMonth,
      lastMonthYear,
    ]);

    // Calculate completed percentage change
    const currentMonthCompleted = parseInt(completedData[0].current_month_completed);
    const lastMonthCompleted = parseInt(completedData[0].last_month_completed);
    let completedPercentageChange = 0;
    
    if (lastMonthCompleted > 0) {
      completedPercentageChange = ((currentMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100;
    } else if (currentMonthCompleted > 0) {
      completedPercentageChange = 100;
    }

    // 4. Top Category (Sitting vs Sleeper) - Current month
    const categoryQuery = `
      SELECT 
        booking_type,
        COUNT(*) as count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM bookings
      WHERE EXTRACT(MONTH FROM created_at) = $1 
      AND EXTRACT(YEAR FROM created_at) = $2
      GROUP BY booking_type;
    `;
    const { rows: categoryData } = await client.query(categoryQuery, [
      currentMonth,
      currentYear,
    ]);

    const categories = {
      sitting: { count: 0, revenue: 0 },
      sleeper: { count: 0, revenue: 0 },
    };

    categoryData.forEach((cat) => {
      if (cat.booking_type === 'sitting') {
        categories.sitting.count = parseInt(cat.count);
        categories.sitting.revenue = parseFloat(cat.revenue);
      } else if (cat.booking_type === 'sleeper') {
        categories.sleeper.count = parseInt(cat.count);
        categories.sleeper.revenue = parseFloat(cat.revenue);
      }
    });

    const totalCategoryCount = categories.sitting.count + categories.sleeper.count;
    const sittingPercentage = totalCategoryCount > 0 ? (categories.sitting.count / totalCategoryCount) * 100 : 0;
    const sleeperPercentage = totalCategoryCount > 0 ? (categories.sleeper.count / totalCategoryCount) * 100 : 0;

    // 5. Active Bookings by Type (for capacity tracking)
    const activeBookingsQuery = `
      SELECT 
        booking_type,
        COUNT(*) as active_count,
        COALESCE(SUM(number_of_persons), 0) as total_persons
      FROM bookings
      WHERE booking_status = 'active'
      GROUP BY booking_type;
    `;
    const { rows: activeData } = await client.query(activeBookingsQuery);

    const activeBookings = {
      sitting: { count: 0, persons: 0 },
      sleeper: { count: 0, persons: 0 },
    };

    activeData.forEach((type) => {
      if (type.booking_type === 'sitting') {
        activeBookings.sitting.count = parseInt(type.active_count);
        activeBookings.sitting.persons = parseInt(type.total_persons);
      } else if (type.booking_type === 'sleeper') {
        activeBookings.sleeper.count = parseInt(type.active_count);
        activeBookings.sleeper.persons = parseInt(type.total_persons);
      }
    });

    // Response
    res.status(200).json({
      message: "Dashboard statistics retrieved successfully",
      data: {
        revenue: {
          total: parseFloat(revenueData[0].total_revenue),
          current_month: currentMonthRevenue,
          last_month: lastMonthRevenue,
          percentage_change: parseFloat(revenuePercentageChange.toFixed(2)),
          trend: revenuePercentageChange >= 0 ? "up" : "down",
        },
        bookings: {
          total: parseInt(bookingsData[0].total_bookings),
          today: todayBookings,
          yesterday: yesterdayBookings,
          change: bookingsChange,
          trend: bookingsChange >= 0 ? "up" : "down",
        },
        completed: {
          total: parseInt(completedData[0].total_completed),
          current_month: currentMonthCompleted,
          last_month: lastMonthCompleted,
          percentage_change: parseFloat(completedPercentageChange.toFixed(2)),
          trend: completedPercentageChange >= 0 ? "up" : "down",
        },
        top_category: {
          sitting: {
            count: categories.sitting.count,
            revenue: categories.sitting.revenue,
            percentage: parseFloat(sittingPercentage.toFixed(2)),
          },
          sleeper: {
            count: categories.sleeper.count,
            revenue: categories.sleeper.revenue,
            percentage: parseFloat(sleeperPercentage.toFixed(2)),
          },
          total_count: totalCategoryCount,
        },
        active_bookings: {
          sitting: {
            count: activeBookings.sitting.count,
            persons: activeBookings.sitting.persons,
            capacity: 50, // You can make this configurable
          },
          sleeper: {
            count: activeBookings.sleeper.count,
            persons: activeBookings.sleeper.persons,
            capacity: 50, // You can make this configurable
          },
        },
      },
    });
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Monthly Revenue Chart Data (for the last 6 months or custom range)
const getMonthlyRevenue = async (req, res) => {
  const { year, months } = req.query; // Optional: specify year and number of months
  
  const client = await db.connect();
  try {
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const numberOfMonths = months ? parseInt(months) : 6;

    // Get monthly revenue for the specified period
    const monthlyRevenueQuery = `
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        EXTRACT(YEAR FROM created_at) as year,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as booking_count,
        booking_type,
        COALESCE(SUM(paid_amount), 0) as paid_revenue
      FROM bookings
      WHERE EXTRACT(YEAR FROM created_at) = $1
      AND EXTRACT(MONTH FROM created_at) <= EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at), booking_type
      ORDER BY year, month;
    `;

    const { rows } = await client.query(monthlyRevenueQuery, [currentYear]);

    // Organize data by month
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyData = {};
    
    // Initialize all months
    for (let i = 1; i <= 12; i++) {
      monthlyData[i] = {
        month: monthNames[i - 1],
        month_number: i,
        year: currentYear,
        total_revenue: 0,
        sitting_revenue: 0,
        sleeper_revenue: 0,
        total_bookings: 0,
        sitting_bookings: 0,
        sleeper_bookings: 0,
        paid_amount: 0,
      };
    }

    // Fill in actual data
    rows.forEach((row) => {
      const monthNum = parseInt(row.month);
      const revenue = parseFloat(row.revenue);
      const bookingCount = parseInt(row.booking_count);
      const paidRevenue = parseFloat(row.paid_revenue);

      monthlyData[monthNum].total_revenue += revenue;
      monthlyData[monthNum].total_bookings += bookingCount;
      monthlyData[monthNum].paid_amount += paidRevenue;

      if (row.booking_type === 'sitting') {
        monthlyData[monthNum].sitting_revenue = revenue;
        monthlyData[monthNum].sitting_bookings = bookingCount;
      } else if (row.booking_type === 'sleeper') {
        monthlyData[monthNum].sleeper_revenue = revenue;
        monthlyData[monthNum].sleeper_bookings = bookingCount;
      }
    });

    // Convert to array and filter for requested months
    const currentMonth = new Date().getMonth() + 1;
    const chartData = Object.values(monthlyData)
      .filter(month => month.month_number <= currentMonth)
      .slice(-numberOfMonths);

    res.status(200).json({
      message: "Monthly revenue data retrieved successfully",
      year: currentYear,
      data: chartData,
    });
  } catch (err) {
    console.error("Error fetching monthly revenue:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Daily Revenue for Current Month
const getDailyRevenue = async (req, res) => {
  const { month, year } = req.query;
  
  const client = await db.connect();
  try {
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const dailyRevenueQuery = `
      SELECT 
        EXTRACT(DAY FROM created_at) as day,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as booking_count,
        booking_type
      FROM bookings
      WHERE EXTRACT(MONTH FROM created_at) = $1
      AND EXTRACT(YEAR FROM created_at) = $2
      GROUP BY EXTRACT(DAY FROM created_at), booking_type
      ORDER BY day;
    `;

    const { rows } = await client.query(dailyRevenueQuery, [targetMonth, targetYear]);

    // Get number of days in the month
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    
    // Initialize daily data
    const dailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      dailyData.push({
        day: day,
        date: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        total_revenue: 0,
        sitting_revenue: 0,
        sleeper_revenue: 0,
        total_bookings: 0,
      });
    }

    // Fill in actual data
    rows.forEach((row) => {
      const dayIndex = parseInt(row.day) - 1;
      const revenue = parseFloat(row.revenue);
      const bookingCount = parseInt(row.booking_count);

      dailyData[dayIndex].total_revenue += revenue;
      dailyData[dayIndex].total_bookings += bookingCount;

      if (row.booking_type === 'sitting') {
        dailyData[dayIndex].sitting_revenue = revenue;
      } else if (row.booking_type === 'sleeper') {
        dailyData[dayIndex].sleeper_revenue = revenue;
      }
    });

    res.status(200).json({
      message: "Daily revenue data retrieved successfully",
      month: targetMonth,
      year: targetYear,
      data: dailyData,
    });
  } catch (err) {
    console.error("Error fetching daily revenue:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Top Performing Workers (based on bookings handled)
const getTopWorkers = async (req, res) => {
  const { limit = 10, month, year } = req.query;
  
  const client = await db.connect();
  try {
    let query = `
      SELECT 
        w.worker_id,
        w.full_name,
        w.mobile_number,
        COUNT(b.booking_id) as total_bookings,
        COALESCE(SUM(b.total_amount), 0) as total_revenue,
        COUNT(CASE WHEN b.booking_status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.booking_status = 'active' THEN 1 END) as active_bookings
      FROM worker_accounts w
      LEFT JOIN bookings b ON w.worker_id = b.worker_id
    `;

    const params = [];
    let paramCount = 1;

    // Add date filters if provided
    if (month && year) {
      query += ` WHERE EXTRACT(MONTH FROM b.created_at) = $${paramCount} AND EXTRACT(YEAR FROM b.created_at) = $${paramCount + 1}`;
      params.push(parseInt(month), parseInt(year));
      paramCount += 2;
    }

    query += `
      GROUP BY w.worker_id, w.full_name, w.mobile_number
      ORDER BY total_bookings DESC, total_revenue DESC
      LIMIT $${paramCount};
    `;
    params.push(parseInt(limit));

    const { rows } = await client.query(query, params);

    res.status(200).json({
      message: "Top workers retrieved successfully",
      count: rows.length,
      data: rows.map(worker => ({
        worker_id: worker.worker_id,
        full_name: worker.full_name,
        mobile_number: worker.mobile_number,
        total_bookings: parseInt(worker.total_bookings),
        total_revenue: parseFloat(worker.total_revenue),
        completed_bookings: parseInt(worker.completed_bookings),
        active_bookings: parseInt(worker.active_bookings),
      })),
    });
  } catch (err) {
    console.error("Error fetching top workers:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Recent Bookings (for dashboard display)
const getRecentBookings = async (req, res) => {
  const { limit = 10, status } = req.query;
  
  const client = await db.connect();
  try {
    let query = `
      SELECT 
        b.booking_id,
        b.guest_name,
        b.phone_number,
        b.number_of_persons,
        b.booking_type,
        b.booking_date,
        b.in_time,
        b.out_time,
        b.total_amount,
        b.paid_amount,
        b.balance_amount,
        b.booking_status,
        b.created_at,
        w.full_name as worker_name,
        a.full_name as admin_name
      FROM bookings b
      LEFT JOIN worker_accounts w ON b.worker_id = w.worker_id
      LEFT JOIN admin_accounts a ON b.admin_id = a.admin_id
    `;

    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` WHERE b.booking_status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    query += `
      ORDER BY b.created_at DESC
      LIMIT $${paramCount};
    `;
    params.push(parseInt(limit));

    const { rows } = await client.query(query, params);

    res.status(200).json({
      message: "Recent bookings retrieved successfully",
      count: rows.length,
      data: rows,
    });
  } catch (err) {
    console.error("Error fetching recent bookings:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

// Get Payment Analytics
const getPaymentAnalytics = async (req, res) => {
  const { month, year } = req.query;
  
  const client = await db.connect();
  try {
    const currentDate = new Date();
    const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const targetYear = year ? parseInt(year) : currentDate.getFullYear();

    const paymentQuery = `
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        COALESCE(SUM(paid_amount), 0) as total_paid,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(SUM(balance_amount), 0) as total_balance
      FROM bookings
      WHERE EXTRACT(MONTH FROM created_at) = $1
      AND EXTRACT(YEAR FROM created_at) = $2
      GROUP BY payment_method;
    `;

    const { rows } = await client.query(paymentQuery, [targetMonth, targetYear]);

    // Calculate totals
    let totalTransactions = 0;
    let totalPaid = 0;
    let totalAmount = 0;
    let totalBalance = 0;

    const paymentMethods = {
      cash: { count: 0, paid: 0, total: 0, balance: 0, percentage: 0 },
      card: { count: 0, paid: 0, total: 0, balance: 0, percentage: 0 },
      upi: { count: 0, paid: 0, total: 0, balance: 0, percentage: 0 },
    };

    rows.forEach((row) => {
      const method = row.payment_method;
      const count = parseInt(row.transaction_count);
      const paid = parseFloat(row.total_paid);
      const amount = parseFloat(row.total_amount);
      const balance = parseFloat(row.total_balance);

      totalTransactions += count;
      totalPaid += paid;
      totalAmount += amount;
      totalBalance += balance;

      if (paymentMethods[method]) {
        paymentMethods[method].count = count;
        paymentMethods[method].paid = paid;
        paymentMethods[method].total = amount;
        paymentMethods[method].balance = balance;
      }
    });

    // Calculate percentages
    if (totalPaid > 0) {
      Object.keys(paymentMethods).forEach((method) => {
        paymentMethods[method].percentage = parseFloat(
          ((paymentMethods[method].paid / totalPaid) * 100).toFixed(2)
        );
      });
    }

    res.status(200).json({
      message: "Payment analytics retrieved successfully",
      month: targetMonth,
      year: targetYear,
      summary: {
        total_transactions: totalTransactions,
        total_paid: totalPaid,
        total_amount: totalAmount,
        total_balance: totalBalance,
        collection_rate: totalAmount > 0 ? parseFloat(((totalPaid / totalAmount) * 100).toFixed(2)) : 0,
      },
      payment_methods: paymentMethods,
    });
  } catch (err) {
    console.error("Error fetching payment analytics:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};

module.exports = {
  getDashboardStats,
  getMonthlyRevenue,
  getDailyRevenue,
  getTopWorkers,
  getRecentBookings,
  getPaymentAnalytics,
};
