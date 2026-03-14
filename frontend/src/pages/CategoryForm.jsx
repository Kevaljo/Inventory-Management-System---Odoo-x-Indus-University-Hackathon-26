import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EMOJI_OPTIONS = ['📦', '💧', '⚙️', '🧪', '🧊', '🛢️', '🔧', '⚛️', '🏷️', '🔩', '🔨', '📏', '🦺', '🧲', '🪵', '🏭', '🏗️', '🔋', '🛡️', '🧰'];

const CategoryForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '📦'
    });

    useEffect(() => {
        if (isEditing) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const res = await api.get(`/categories/${id}`);
            setFormData({
                name: res.data.name || '',
                description: res.data.description || '',
                icon: res.data.icon || '📦'
            });
        } catch (err) {
            toast.error('Failed to load category details.');
            navigate('/categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/categories/${id}`, formData);
                toast.success('Category updated successfully');
            } else {
                await api.post('/categories', formData);
                toast.success('Category created successfully');
            }
            navigate('/categories');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save category');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-8 text-slate-400">Loading category data...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate('/categories')} className="p-2 text-slate-500 hover:text-slate-200 hover:glass-panel/10 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h1 className="text-2xl font-bold text-white">{isEditing ? '✏️ Edit Category' : '🆕 New Category'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-sm border border-white/5 p-8 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-3">Category Icon</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {EMOJI_OPTIONS.map(emoji => (
                            <button
                                type="button"
                                key={emoji}
                                onClick={() => setFormData({...formData, icon: emoji})}
                                className={`text-2xl p-2 rounded-lg transition-all ${formData.icon === emoji ? 'bg-purple-500/30 ring-2 ring-purple-500 scale-110 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'glass-panel/5 hover:glass-panel/10 grayscale hover:grayscale-0 opacity-60 hover:opacity-100'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-slate-200 mb-2">Category Name *</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 glass-panel/5 border border-white/10 rounded-lg focus:glass-panel focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. Iron, Zinc, Liquid Chemicals..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Description</label>
                    <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 glass-panel/5 border border-white/10 rounded-lg focus:glass-panel focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                        placeholder="Brief description of products in this category..."
                    />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
                    <button type="button" onClick={() => navigate('/categories')} className="px-6 py-2.5 text-slate-300 hover:glass-panel/10 font-medium rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50">
                        {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Category'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;