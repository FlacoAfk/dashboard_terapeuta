import React from 'react';

const MiniStat = ({ icon, value, label, color = 'gray' }) => {
    const colorMap = {
        green: 'bg-green-50 text-green-700 border-green-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        orange: 'bg-orange-50 text-orange-700 border-orange-200',
        red: 'bg-red-50 text-red-700 border-red-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        gray: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colorMap[color]}`}>
            <span className="text-xl">{icon}</span>
            <div>
                <p className="text-2xl font-bold leading-none">{value}</p>
                <p className="text-xs opacity-75 mt-0.5">{label}</p>
            </div>
        </div>
    );
};

export default MiniStat;
