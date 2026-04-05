import React from 'react';
import { 
  Package, 
  AlertTriangle, 
  ClipboardList, 
  DollarSign 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Card, StatCard } from './Common';

interface DashboardProps {
  stats: any;
  isDarkMode: boolean;
  onNavigate: (tab: string, search?: string) => void;
}

export const Dashboard = ({ stats, isDarkMode, onNavigate }: DashboardProps) => {
  const textColor = isDarkMode ? '#a1a1aa' : '#71717a';
  const gridColor = isDarkMode ? '#27272a' : '#f1f1f1';
  const barColor = isDarkMode ? '#f4f4f5' : '#18181b';
  
  const COLORS = ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="TOTAL PRODUTOS" 
          value={stats?.totalProducts || 0} 
          icon={Package} 
          color="bg-blue-500" 
          onClick={() => onNavigate('inventory', '')}
        />
        <StatCard 
          label="ESTOQUE BAIXO" 
          value={stats?.lowStock || 0} 
          icon={AlertTriangle} 
          color="bg-amber-500" 
          onClick={() => onNavigate('inventory', 'ESTOQUE BAIXO')}
        />
        <StatCard 
          label="ORDENS ATIVAS" 
          value={stats?.activeOrders || 0} 
          icon={ClipboardList} 
          color="bg-indigo-500" 
          onClick={() => onNavigate('kanban')}
        />
        <StatCard 
          label="VALOR TOTAL ESTOQUE" 
          value={`R$ ${(stats?.totalInventoryValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          icon={DollarSign} 
          color="bg-emerald-500" 
          onClick={() => onNavigate('inventory')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="VALOR EM ESTOQUE POR CATEGORIA">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats?.stockByCategory || []} 
                layout="vertical" 
                margin={{ left: 40, right: 20 }}
                barCategoryGap="35%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: textColor}} />
                <YAxis 
                  dataKey="category" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 14, fill: textColor}} 
                  width={120} 
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                    color: isDarkMode ? '#f4f4f5' : '#18181b'
                  }}
                />
                <Bar dataKey="total_value" fill={barColor} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="DISTRIBUIÇÃO DE STATUS DE ESTOQUE">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.stockStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats?.stockStatus?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="TOP 5 PRODUTOS EM QUANTIDADE">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: textColor}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: textColor}} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                  }}
                />
                <Bar dataKey="quantity" fill={barColor} radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};
