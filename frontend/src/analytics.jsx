import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

// Register the required elements
ChartJS.register(ArcElement, Tooltip, Legend);

function Analytics() {
    const [chartData, setChartData] = useState(null);

    // Fetch grouped expenses from backend
    useEffect(() => {
      let isMounted = true;
  
      fetch("http://127.0.0.1:5000/analytics/group-by-category", {
          method: "GET",
          headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      })
          .then((response) => response.json())
          .then((data) => {
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
          })
          .catch((error) => console.error("Error fetching analytics data:", error));
  
      return () => {
          isMounted = false; // Prevent setting state if the component unmounts
      };
  }, []);

    return (
        <div>
            {chartData ? (
                <Pie data={chartData} />
            ) : (
                <p>Loading chart data...</p>
            )}
        </div>
    );
}

export default Analytics;
