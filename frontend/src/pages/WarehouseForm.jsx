import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

const WarehouseForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    
    // For react-select options
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: '',
        country: '',
        state: '',
        city: ''
    });

    // Populate dropdowns
    const countries = useMemo(() => Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name })), []);
    
    const states = useMemo(() => {
        if (!selectedCountry) return [];
        return State.getStatesOfCountry(selectedCountry.value).map(s => ({ value: s.isoCode, label: s.name, countryCode: selectedCountry.value }));
    }, [selectedCountry]);
    
    const cities = useMemo(() => {
        if (!selectedState) return [];
        return City.getCitiesOfState(selectedState.countryCode, selectedState.value).map(c => ({ value: c.name, label: c.name }));
    }, [selectedState]);

    useEffect(() => {
        if (isEditing) {
            fetchWarehouse();
        }
    }, [id]);

    const fetchWarehouse = async () => {
        try {
            const res = await api.get(`/warehouses/${id}`);
            const data = res.data;
            
            setFormData({
                name: data.name || '',
                code: data.code || '',
                address: data.address || '',
                country: data.country || '',
                state: data.state || '',
                city: data.city || ''
            });

            if (data.country) {
                const c = countries.find(x => x.label === data.country);
                if (c) {
                    setSelectedCountry(c);
                    if (data.state) {
                        const sList = State.getStatesOfCountry(c.value);
                        const sId = sList.find(x => x.name === data.state)?.isoCode;
                        if (sId) {
                            const st = { value: sId, label: data.state, countryCode: c.value };
                            setSelectedState(st);
                            
                            if (data.city) {
                                setSelectedCity({ value: data.city, label: data.city });
                            }
                        }
                    }
                }
            }
        } catch (err) {
            toast.error('Failed to load warehouse');
            navigate('/warehouses');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/warehouses/${id}`, formData);
                toast.success('Warehouse updated successfully');
            } else {
                await api.post('/warehouses', formData);
                toast.success('Warehouse created successfully');
            }
            navigate('/warehouses');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save warehouse');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePincodeChange = async (pincode) => {
        if (pincode.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const postOffice = data[0].PostOffice[0];
                    const cityStr = postOffice.District;
                    const stateStr = postOffice.State;
                    const countryStr = "India";
                    
                    setFormData(prev => ({ ...prev, city: cityStr, state: stateStr, country: countryStr }));
                    
                    const c = countries.find(x => x.label === countryStr);
                    if (c) {
                        setSelectedCountry(c);
                        const sList = State.getStatesOfCountry(c.value);
                        const sObj = sList.find(x => x.name.toLowerCase() === stateStr.toLowerCase());
                        if (sObj) {
                            setSelectedState({ value: sObj.isoCode, label: sObj.name, countryCode: c.value });
                            setSelectedCity({ value: cityStr, label: cityStr });
                        }
                    }
                    toast.success('Location details populated via Pincode');
                } else {
                    toast.error('Invalid Pincode provided.');
                }
            } catch (err) {
                toast.error('Failed to fetch Pincode info');
            }
        }
    };

    if (loading) return <div className="text-center p-8 text-slate-400">Loading...</div>;

    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            padding: '4px',
            borderRadius: '0.5rem',
            borderColor: state.isFocused ? '#a855f7' : '#e5e7eb',
            boxShadow: state.isFocused ? '0 0 0 2px #e9d5ff' : 'none',
            '&:hover': { borderColor: '#a855f7' }
        })
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate('/warehouses')} className="text-slate-500 hover:text-slate-200">← Back</button>
                <h1 className="text-2xl font-bold text-white">{isEditing ? '✏️ Edit Warehouse' : '🏭 New Warehouse'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-sm border border-white/5 p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">Warehouse Name *</label>
                        <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. Main Distribution Center" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">Warehouse Code *</label>
                        <input required type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-3 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono uppercase" placeholder="e.g. MDC" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Pincode (Auto-fill Location)</label>
                    <input type="text" maxLength="6" onChange={(e) => handlePincodeChange(e.target.value)} className="w-full md:w-1/3 px-4 py-3 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g. 110001" />
                    <p className="text-xs text-slate-400 mt-1">Enter a valid 6-digit Indian Pincode to automatically populate the Country, State, and City.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">Country</label>
                        <Select
                            options={countries}
                            value={selectedCountry}
                            styles={customSelectStyles}
                            onChange={(Item) => {
                                setSelectedCountry(Item);
                                setSelectedState(null);
                                setSelectedCity(null);
                                setFormData({...formData, country: Item?.label || '', state: '', city: ''});
                            }}
                            isClearable
                            placeholder="Select Country..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">State / Region</label>
                        <Select
                            options={states}
                            value={selectedState}
                            isDisabled={!selectedCountry}
                            styles={customSelectStyles}
                            onChange={(Item) => {
                                setSelectedState(Item);
                                setSelectedCity(null);
                                setFormData({...formData, state: Item?.label || '', city: ''});
                            }}
                            isClearable
                            placeholder="Select State..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-200 mb-2">City / District</label>
                        <Select
                            options={cities}
                            value={selectedCity}
                            isDisabled={!selectedState}
                            styles={customSelectStyles}
                            onChange={(Item) => {
                                setSelectedCity(Item);
                                setFormData({...formData, city: Item?.label || ''});
                            }}
                            isClearable
                            placeholder="Select City..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Detailed Address / Street</label>
                    <textarea rows="3" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 border border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" placeholder="Full street address..." />
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 mt-8 border-t">
                    <button type="button" onClick={() => navigate('/warehouses')} className="px-6 py-2.5 text-slate-300 hover:glass-panel/10 font-medium rounded-lg">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-lg shadow-sm disabled:opacity-50">
                        {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Warehouse'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default WarehouseForm;