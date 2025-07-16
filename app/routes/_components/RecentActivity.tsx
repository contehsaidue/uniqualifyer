import { Bell } from 'lucide-react';

interface RecentActivityProps {
  title: string;
  activities: Array<{ id: number; text: string; time: string }>;
}

export default function RecentActivity({ title, activities }: RecentActivityProps) {
  return (
    <div className="border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.map(item => (
          <div key={item.id} className="flex items-start pb-4 last:pb-0 border-b border-gray-100 last:border-0">
            <div className="bg-indigo-100 p-2 rounded-lg mr-4">
              <Bell className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-800">{item.text}</p>
              <p className="text-sm text-gray-500">{item.time}</p>
            </div>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}