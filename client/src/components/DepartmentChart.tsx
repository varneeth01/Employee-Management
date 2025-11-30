import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DepartmentData {
  department: string;
  present: number;
  total: number;
  percentage: number;
}

interface DepartmentChartProps {
  data: DepartmentData[];
}

const COLORS = [
  "hsl(217 91% 60%)",
  "hsl(173 58% 39%)",
  "hsl(43 74% 66%)",
  "hsl(27 87% 67%)",
  "hsl(262 83% 58%)",
];

export function DepartmentChart({ data }: DepartmentChartProps) {
  return (
    <div className="h-64 w-full" data-testid="department-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            dataKey="department"
            type="category"
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            width={100}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}%`,
              "Attendance Rate",
            ]}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
