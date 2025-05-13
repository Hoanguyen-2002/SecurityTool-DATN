import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../api/dashboardApi';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';

const Dashboard: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboardStats'], queryFn: fetchDashboardStats });

  if (isLoading) return <Loading />;
  if (isError) return <ErrorDisplay message={(error as any)?.message} />;
  if (!data) return <Loading />;

  return (
      <div>
        <h1 className="text-2xl mb-4">Dashboard</h1>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded shadow">Total Applications: {data.totalApps}</div>
          <div className="p-4 bg-white rounded shadow">Total Scans: {data.totalScans}</div>
          <div className="p-4 bg-white rounded shadow">Total Issues: {data.totalIssues}</div>
          <div className="p-4 bg-white rounded shadow">
            <h2 className="text-lg font-bold mb-2">Severity Distribution</h2>
            <ul>
              {Object.entries(data.severityDistribution).map(([severity, count]) => (
                <li key={severity} className="flex">
                  <span className="mr-4">{severity}:</span>
                  <span>{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
  );
};

export default Dashboard;