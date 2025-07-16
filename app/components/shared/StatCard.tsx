interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change: string;
}

export function StatCard({ icon, title, value, change }: StatCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-50 p-2 rounded-lg">{icon}</div>
          <h3 className="text-gray-500 font-medium">{title}</h3>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-green-600 mt-1">{change}</p>
      </div>
    </div>
  );
}