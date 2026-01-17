// src/components/ManageCities.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Pencil,
    Trash2,
    Plus,
    Search,
    Eye,
    EyeOff,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import cityAPI from '../apis/cityAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';

const ManageCities = () => {
    const { themeColors } = useTheme();

    const auth = useSelector((state) => state.auth.user);
    const token = auth?.token;
    const [viewType, setViewType] = useState('grid');
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [filteredStates, setFilteredStates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ country: '', state: '', status: 'all' });
    const [showFilters, setShowFilters] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [formData, setFormData] = useState({ name: '', country: '', state: '', isActive: true });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        filterCities();
    }, [searchTerm, filters, cities]);

    useEffect(() => {
        if (filters.country) {
            const filtered = states.filter((s) => s.country._id === filters.country);
            setFilteredStates(filtered);
        } else {
            setFilteredStates(states);
        }
    }, [filters.country, states]);

    useEffect(() => {
        if (formData.country) {
            const filtered = states.filter((s) => s.country._id === formData.country);
            setFilteredStates(filtered);
            if (formData.state) {
                const currentState = states.find((s) => s._id === formData.state);
                if (!currentState || currentState.country._id !== formData.country) {
                    setFormData((p) => ({ ...p, state: '' }));
                }
            }
        } else {
            setFilteredStates(states);
        }
    }, [formData.country, states]);

    const fetchData = async () => {
        try {
            setLoading(true);
            await Promise.all([fetchCities(), fetchCountries(), fetchStates()]);
        } catch (err) {
            toast.error('Failed to fetch data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCities = async () => {
        try {
            const res = await cityAPI.getCities({}, token);
            setCities(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch cities');
        }
    };

    const fetchCountries = async () => {
        try {
            const res = await countryAPI.getCountries(token);
            setCountries(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch countries');
        }
    };

    const fetchStates = async () => {
        try {
            const res = await stateAPI.getStates({}, token);
            setStates(res.data.data);
            setFilteredStates(res.data.data);
        } catch (err) {
            toast.error('Failed to fetch states');
        }
    };

    const filterCities = () => {
        let filtered = cities;
        if (searchTerm) {
            filtered = filtered.filter((city) =>
                city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                city.state?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                city.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filters.country) filtered = filtered.filter((c) => c.country._id === filters.country);
        if (filters.state) filtered = filtered.filter((c) => c.state._id === filters.state);
        if (filters.status === 'active') filtered = filtered.filter((c) => c.isActive);
        else if (filters.status === 'inactive') filtered = filtered.filter((c) => !c.isActive);
        setFilteredCities(filtered);
    };

    const handleCreateCity = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'City name is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }
        try {
            const res = await cityAPI.createCity(formData, token);
            setCities((s) => [...s, res.data.data]);
            setShowCreateModal(false);
            setFormData({ name: '', country: '', state: '', isActive: true });
            toast.success('City created successfully');
            fetchCities();
        } catch (err) {
            if (err.response?.data?.message === 'City already exists in this state') setErrors({ name: 'City already exists in this state' });
            else if (err.response?.data?.message === "State not found or doesn't belong to the specified country") setErrors({ state: 'State does not belong to the selected country' });
            else toast.error('Failed to create city');
        }
    };

    const handleUpdateCity = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'City name is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (Object.keys(newErrors).length) {
            setErrors(newErrors);
            return;
        }
        try {
            const res = await cityAPI.updateCity(selectedCity._id, formData, token);
            const updated = cities.map((c) => (c._id === selectedCity._id ? res.data.data : c));
            setCities(updated);
            setShowEditModal(false);
            setSelectedCity(null);
            toast.success('City updated successfully');
            fetchCities();
        } catch (err) {
            if (err.response?.data?.message === 'City with this name already exists in the state') setErrors({ name: 'City name already exists in this state' });
            else if (err.response?.data?.message === "State not found or doesn't belong to the specified country") setErrors({ state: 'State does not belong to the selected country' });
            else toast.error('Failed to update city');
        }
    };

    const handleDeleteCity = async (id) => {
        if (!window.confirm('Are you sure you want to delete this city?')) return;
        try {
            await cityAPI.deleteCity(id, token);
            setCities((s) => s.filter((c) => c._id !== id));
            toast.success('City deleted successfully');
            fetchCities();
        } catch (err) {
            toast.error('Failed to delete city');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await cityAPI.toggleCityStatus(id, token);
            // setCities((s) => s.map((c) => (c._id === id ? res.data.data : c)));
            fetchCities();
            toast.success(`City ${res.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (err) {
            toast.error('Failed to update city status');
        }
    };

    const openEditModal = (city) => {
        setSelectedCity(city);
        setFormData({ name: city.name, country: city.country._id, state: city.state._id, isActive: city.isActive });
        setErrors({});
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedCity(null);
        setFormData({ name: '', country: '', state: '', isActive: true });
        setErrors({});
    };

    const resetFilters = () => {
        setFilters({ country: '', state: '', status: 'all' });
        setSearchTerm('');
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
            <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
        </div>
    );

    return (
        <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, boxShadow: `0 2px 16px ${themeColors.primary}10` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage Cities</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
                    onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
                >
                    <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
                    Add City
                </button>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Grid View</button>
                    <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Table View</button>
                </div>
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search cities, states, or countries..." style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }} />
                </div>

                <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
                    <button onClick={() => setShowFilters((s) => !s)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
                        {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
                    </button>
                    {showFilters && (
                        <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                                <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, state: '' })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                                    <option value="">All Countries</option>
                                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                                <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })} disabled={!filters.country} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                                    <option value="">All States</option>
                                    {states.filter((s) => !filters.country || s.country._id === filters.country).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                                    <option value="all">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <button onClick={resetFilters} style={{ padding: '8px 12px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Reset Filters</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {viewType === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                    {filteredCities.length === 0 ? (
                        <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background }}>No cities found</div>
                    ) : filteredCities.map((city) => (
                        <div key={city._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
                            <div className='flex items-start justify-between '>
                            <div>
                                <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 18, marginBottom: 6 }}>{city.name}</div>
                                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>State: <span style={{ fontWeight: 600, color: themeColors.accent }}>{city.state?.name || 'N/A'}</span></div>
                                <div style={{ fontSize: 13, color: themeColors.text }}>Country: <span style={{ fontWeight: 600, color: themeColors.accent }}>{city.country?.name || 'N/A'}</span></div>
                            </div>
                                <div style={{ fontWeight: 400, color: themeColors.primary, fontSize: 18, marginBottom: 6 }}>ID-{city.cityId || "NA"}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                                <span style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: city.isActive ? themeColors.success : themeColors.danger, color: city.isActive ? themeColors.text : themeColors.surfaceDark }}>{city.isActive ? 'Active' : 'Inactive'}</span>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => handleToggleStatus(city._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>{city.isActive ? 'Deactivate' : 'Activate'}</button>
                                    <button onClick={() => openEditModal(city)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                                    <button onClick={() => handleDeleteCity(city._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ overflowX: 'auto', width: '100%' }}>
                    <table style={{ minWidth: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: themeColors.background }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>S.No.</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>ID</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Name</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>State</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Country</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCities.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: themeColors.text }}>No cities found</td></tr>
                            ) : filteredCities.map((city, index) => (
                                <tr key={city._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                                    <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 200 }}>{index}</td>
                                    <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>{city.cityId}</td>
                                    <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>{city.name}</td>
                                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{city.state?.name || 'N/A'}</td>
                                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{city.country?.name || 'N/A'}</td>
                                    <td style={{ padding: '12px 16px' }}><span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: city.isActive ? themeColors.success : themeColors.danger, color: city.isActive ? themeColors.text : themeColors.surfaceDark }}>{city.isActive ? 'Active' : 'Inactive'}</span></td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleToggleStatus(city._id)} title={city.isActive ? 'Deactivate' : 'Activate'} style={{ color: themeColors.text }}>{city.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}</button>
                                            <button onClick={() => openEditModal(city)} title="Edit" style={{ color: themeColors.primary }}><Pencil style={{ height: 16, width: 16, color: themeColors.primary }} /></button>
                                            <button onClick={() => handleDeleteCity(city._id)} title="Delete" style={{ color: themeColors.danger }}><Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
                    <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
                        <div style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Add New City</h2>
                            <form onSubmit={handleCreateCity}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City Name</label>
                                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter city name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                                    {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                                    <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                                        <option value="">Select Country</option>
                                        {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                                        <option value="">Select State</option>
                                        {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                    {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                                    <label htmlFor="isActive" style={{ color: themeColors.text }}>Active</label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedCity && (
                <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
                    <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
                        <div style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Edit City</h2>
                            <form onSubmit={handleUpdateCity}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City Name</label>
                                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter city name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                                    {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                                    <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                                        <option value="">Select Country</option>
                                        {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                    {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                                    <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                                        <option value="">Select State</option>
                                        {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                    {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    <input type="checkbox" id="editIsActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                                    <label htmlFor="editIsActive" style={{ color: themeColors.text }}>Active</label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                                    <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Update</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCities;