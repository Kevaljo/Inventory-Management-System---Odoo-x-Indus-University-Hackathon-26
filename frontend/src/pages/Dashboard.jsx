import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const KPICard = ({ title, value, icon, color, subtitle }) => (
  <div className={`glass-card rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 w-full`}>
    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-${color}-500/20 rounded-full blur-2xl group-hover:bg-${color}-500/30 transition-colors pointer-events-none`}></div>
    <div className={`absolute -left-6 -bottom-6 w-20 h-20 bg-${color}-400/10 rounded-full blur-xl pointer-events-none`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{title}</h3>
        <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 font-['Space_Grotesk'] mt-2">{value}</p>
        {subtitle && <p className={`text-xs text-${color}-400 mt-2 font-medium`}>{subtitle}</p>}
      </div>
      <div className="text-5xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] z-10 relative saturate-150">{icon}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;
  if (!data) return <div className="text-center py-10 text-red-500">Error loading data</div>;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center glass-panel/5 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 text-glow relative z-10">📊 Dashboard</h1>    
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">    
        <KPICard title="Total Products" value={data.kpis.totalProducts} icon="📦" color="indigo" />
        <KPICard title="Categories" value={data.kpis.totalCategories} icon="🏷️" color="purple" />
        <KPICard title="Low Stock" value={data.kpis.lowStockItems} icon="⚠️" color="amber" />
        <KPICard title="Out of Stock" value={data.kpis.outOfStockItems} icon="🚫" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        {/* Low Stock Alerts */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[450px] relative overflow-hidden group">
           <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-md border-b border-white/10 pb-4">⚠️ Low Stock Alerts</h2>
           <div className="overflow-y-auto pr-2 flex-1 scrollbar-thin">
             {data.lowStockProducts?.length === 0 ? (
               <p className="text-slate-400 text-sm italic">All products are adequately stocked.</p>
             ) : (
               <div className="space-y-3">
                 {data.lowStockProducts.map(product => (
                   <div key={product._id} className="flex justify-between items-center bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 hover:bg-rose-500/20 transition-colors shadow-lg shadow-rose-900/10">
                     <div>
                       <p className="font-bold text-rose-100/90 text-sm tracking-wide">{product.name}</p>
                       <p className="text-xs text-rose-300/60 font-mono mt-1">SKU: {product.sku}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-3xl font-black text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.6)] font-mono">{product.totalStock}</p>
                       <p className="text-[10px] text-red-500 font-medium">Reorder at: {product.reorderLevel}</p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Recent Stock Moves */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[450px] relative overflow-hidden group">
           <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-md border-b border-white/10 pb-4">📋 Recent Stock Moves</h2>
           <div className="overflow-y-auto pr-2 flex-1 scrollbar-thin">
             {data.recentMoves?.length === 0 ? (
               <p className="text-slate-400 text-sm italic">No recent activity.</p>
             ) : (
               <div className="space-y-3">
                 {data.recentMoves.map(move => (
                   <div key={move._id} className="flex justify-between items-center glass-panel/5 p-4 rounded-xl border border-white/10 hover:glass-panel/10 transition-colors backdrop-blur-sm">
                     <div>
                       <p className="font-bold text-rose-100/90 text-sm tracking-wide">
                         {move.product?.name || 'Unknown Product'}
                       </p>
                       <p className="text-xs text-rose-300/60 font-mono mt-1">
                         {new Date(move.date).toLocaleDateString()} • {move.reference}
                       </p>
                     </div>
                     <div className="text-right flex flex-col items-end">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white shadow-sm mb-1 ${
                         move.moveType === 'receipt' ? 'bg-green-500' :
                         move.moveType === 'delivery' ? 'bg-red-500' :
                         'bg-blue-500'
                       }`}>
                         {move.moveType.toUpperCase()}
                       </span>
                       <p className="text-white text-lg drop-shadow-md font-mono">
                         {move.moveType === 'receipt' ? '+' : move.moveType === 'delivery' ? '-' : ''}{move.quantity}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;