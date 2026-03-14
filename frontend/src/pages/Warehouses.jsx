import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const Warehouses = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const fetchWarehouses = async () => {
        try {
            const res = await api.get('/warehouses');
            setWarehouses(res.data);
        } catch (err) {
            toast.error('Failed to load warehouses');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center glass-panel p-6 rounded-xl shadow-sm border border-white/5">
                <div>
                    <h1 className="text-2xl font-bold text-white">🏗️ Warehouses</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage physical locations and storage</p>
                </div>
                <Link to="/warehouses/new" className="mt-4 md:mt-0 bg-purple-700 hover:bg-purple-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm inline-flex items-center space-x-2">
                    <span>+ New Warehouse</span>
                </Link>
            </div>

            <div className="glass-panel rounded-xl shadow-sm border border-white/5 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading warehouses...</div>
                ) : warehouses.length === 0 ? (
                     <div className="p-8 text-center text-slate-400">No warehouses configured yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-max">
                            <thead className="glass-panel/5 text-slate-300 font-medium text-sm border-b">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {warehouses.map(wh => (
                                    <tr key={wh._id} className="hover:glass-panel/5">
                                        <td className="px-6 py-4 font-medium">{wh.name}</td>
                                        <td className="px-6 py-4 text-slate-300">{wh.address || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium uppercase">Active</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link to={`/warehouses/${wh._id}`} className="text-purple-400 hover:text-purple-400 font-medium text-sm">Edit</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Warehouses;