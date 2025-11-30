import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeeklyTrendData {
  date: string;
  present: number;
  absent: number;
  late: number;
}

interface WeeklyTrendChartProps {
  data: WeeklyTrendData[];
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    day: format(parseISO(item.date), "EEE"),
  }));

  return (
    <div className="h-64 w-full" data-testid="weekly-trend-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Legend />
          <Bar
            dataKey="present"
            name="Present"
            fill="hsl(142 76% 36%)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="late"
            name="Late"
            fill="hsl(45 93% 47%)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="absent"
            name="Absent"
            fill="hsl(0 84% 60%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
