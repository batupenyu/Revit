import React from 'react';

function StatCard({ title, value, icon, trend }) {
  const borderColor = trend === 'positive' ? 'border-green-200' : trend === 'negative' ? 'border-red-200' : 'border-gray-200';

  return (
    <div className={`bg-white p-5 rounded-xl shadow-sm border ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {icon && <div className="mt-1">{icon}</div>}
      </div>
    </div>
  );
}

export default StatCard;
