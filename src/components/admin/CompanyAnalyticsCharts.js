import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const CompanyAnalyticsCharts = ({ jobs, interviews, hiringData, type = 'all', height = 220 }) => {
  // Prepare data for Job Postings Chart (e.g., count by month)
  // For demo, grouping by createdAt month (assuming jobs have createdAt)
  const jobPostingsData = React.useMemo(() => {
    if (!jobs) return [];
    const counts = {};
    jobs.forEach((job) => {
      const date = new Date(job.createdAt);
      const month = date.toLocaleString("default", { month: "short", year: "numeric" });
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count }));
  }, [jobs]);

  // Prepare data for Interviews Chart (e.g., count by month)
  const interviewsData = React.useMemo(() => {
    if (!interviews) return [];
    const counts = {};
    interviews.forEach((interview) => {
      const date = new Date(interview.createdAt);
      const month = date.toLocaleString("default", { month: "short", year: "numeric" });
      counts[month] = (counts[month] || 0) + 1;
    });
    return Object.entries(counts).map(([month, count]) => ({ month, count }));
  }, [interviews]);

  // Hiring Data Chart (simple bar chart for active jobs and total interviews)
  const hiringChartData = [
    { name: "Active Jobs", value: hiringData?.activeJobsCount || 0 },
    { name: "Total Interviews", value: hiringData?.totalInterviews || 0 },
  ];

  const renderEmpty = (message) => (
    <div className="flex items-center justify-center h-full text-sm text-gray-500">{message}</div>
  );

  const jobChart = (
    <div>
      <h4 className="text-md font-semibold mb-2">Job Postings Over Time</h4>
      {jobPostingsData.length === 0 ? (
        renderEmpty("No job posting data available.")
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={jobPostingsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const interviewChart = (
    <div>
      <h4 className="text-md font-semibold mb-2">Interviews Over Time</h4>
      {interviewsData.length === 0 ? (
        renderEmpty("No interview data available.")
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={interviewsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  const hiringChart = (
    <div>
      <h4 className="text-md font-semibold mb-2">Hiring Summary</h4>
      {hiringChartData.every((d) => d.value === 0) ? (
        renderEmpty("No hiring data available.")
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={hiringChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );

  if (type === 'jobs') return jobChart;
  if (type === 'interviews') return interviewChart;
  if (type === 'hiring') return hiringChart;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>{jobChart}</div>
      <div>{interviewChart}</div>
      <div>{hiringChart}</div>
    </div>
  );
};

export default CompanyAnalyticsCharts;
