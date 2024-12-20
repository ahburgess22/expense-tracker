import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function Analytics({ refreshTrigger }) {
  const [chartData, setChartData] = useState(null);

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false, // Allows the chart to resize properly
  };

  useEffect(() => {
    let isMounted = true;

    const fetchAnalyticsData = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:5000/analytics/group-by-category",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();

        if (isMounted) {
          const categories = data.data.map((item) => item.category);
          const amounts = data.data.map((item) => item.total_amount);

          setChartData({
            labels: categories,
            datasets: [
              {
                label: "Expenses by Category",
                data: amounts,
                backgroundColor: [
                  "#FF6384",
                  "#36A2EB",
                  "#FFCE56",
                  "#4BC0C0",
                  "#9966FF",
                ],
                hoverOffset: 4,
              },
            ],
          });
        }
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      }
    };

    fetchAnalyticsData();

    // Cleanup to prevent state updates if the component unmounts
    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]); // Add refreshTrigger to re-fetch data when a new expense is added

  return (
    <div>
      {chartData ? (
        <div style={{ width: "100%", height: "300px" }}>
          <Pie data={chartData} options={options} />
        </div>
      ) : (
        <p>Loading chart data...</p>
      )}
    </div>
  );
}

export default Analytics;