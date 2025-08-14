import React from 'react';
import { useUserPlan } from '../hooks/useUserPlan';

const UserPlanDebug: React.FC = () => {
  const { data, loading, error } = useUserPlan();

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h2 className="text-lg font-bold mb-2">User Plan Debug</h2>
      
      {loading && <p className="text-blue-500">Loading user plan data...</p>}
      
      {error && (
        <div className="mb-4">
          <h3 className="text-red-500 font-bold">Error:</h3>
          <pre className="bg-red-50 p-2 rounded text-red-700 text-sm overflow-auto">{error}</pre>
        </div>
      )}
      
      {data && (
        <div>
          <h3 className="font-bold mb-1">User Plan Data:</h3>
          <pre className="bg-green-50 p-2 rounded text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-4">
        <h3 className="font-bold mb-1">Debug Info:</h3>
        <ul className="text-sm">
          <li>Backend URL: {window.location.hostname === 'localhost' ? 
            'http://localhost:4000' : 'https://api.itaagroia.com.br'}</li>
          <li>Frontend URL: {window.location.origin}</li>
          <li>Has Cookies: {document.cookie ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
};

export default UserPlanDebug;