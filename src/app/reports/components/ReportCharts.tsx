"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LabelList, LineChart, Line } from "recharts";

// ... existing ComparisonChart, TypeDistributionChart, DoneRateChart ...

export function TrendChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 11 }}
            dy={10}
          />
          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#3b82f6', fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10b981', fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="tickets" 
            name="Number of Tickets"
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="hours" 
            name="Actual Hours"
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ComparisonChartProps {
  data: any;
}

export function ComparisonChart({ data }: ComparisonChartProps) {
  if (!data) return null;

  const chartData = [
    {
      name: "Total Tickets",
      "Current Period": data.current.totalTickets,
      "Previous Period": data.current.totalTickets / (1 + data.comparison.qoq.ticketsChange / 100),
      "Same Period YoY": data.current.totalTickets / (1 + data.comparison.yoy.ticketsChange / 100),
    },
    {
      name: "Hours (h)",
      "Current Period": data.current.totalActualHours,
      "Previous Period": data.current.totalActualHours / (1 + data.comparison.qoq.hoursChange / 100),
      "Same Period YoY": data.current.totalActualHours / (1 + data.comparison.yoy.hoursChange / 100),
    },
    {
      name: "Hours/Ticket",
      "Current Period": data.current.totalTickets > 0 ? data.current.totalActualHours / data.current.totalTickets : 0,
      "Previous Period": (data.current.totalActualHours / (1 + data.comparison.qoq.hoursChange / 100)) / (data.current.totalTickets / (1 + data.comparison.qoq.ticketsChange / 100) || 1),
      "Same Period YoY": (data.current.totalActualHours / (1 + data.comparison.yoy.hoursChange / 100)) / (data.current.totalTickets / (1 + data.comparison.yoy.ticketsChange / 100) || 1),
    }
  ];

  // Helper to round numbers for display
  const processedData = chartData.map(item => ({
    ...item,
    "Current Period": Math.round((item["Current Period"] as number) * 10) / 10,
    "Previous Period": Math.round((item["Previous Period"] as number) * 10) / 10,
    "Same Period YoY": Math.round((item["Same Period YoY"] as number) * 10) / 10,
  }));

  const COLORS = {
    current: "#2563eb",
    previous: "#f59e0b",
    yoy: "#94a3b8"
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
            dy={10}
          />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip 
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
          <Bar dataKey="Current Period" fill={COLORS.current} radius={[6, 6, 0, 0]} barSize={40}>
            <LabelList dataKey="Current Period" position="top" style={{ fontSize: 10, fontWeight: 700, fill: COLORS.current }} />
          </Bar>
          <Bar dataKey="Previous Period" fill={COLORS.previous} radius={[6, 6, 0, 0]} barSize={40}>
             <LabelList dataKey="Previous Period" position="top" style={{ fontSize: 10, fontWeight: 700, fill: COLORS.previous }} />
          </Bar>
          <Bar dataKey="Same Period YoY" fill={COLORS.yoy} radius={[6, 6, 0, 0]} barSize={40}>
             <LabelList dataKey="Same Period YoY" position="top" style={{ fontSize: 10, fontWeight: 700, fill: COLORS.yoy }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TypeDistributionChart({ data }: { data: any }) {
  if (!data) return null;
  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.current.typeDistribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.current.typeDistribution.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DoneRateChart({ data }: { data: any }) {
  if (!data) return null;
  const pieData = [
    { name: "Completed", value: data.current.doneTickets },
    { name: "Incomplete", value: data.current.totalTickets - data.current.doneTickets },
  ];
  const COLORS = ["#10b981", "#e2e8f0"];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            startAngle={90}
            endAngle={450}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
