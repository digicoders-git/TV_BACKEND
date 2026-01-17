import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus, Search, Eye, EyeOff, RefreshCw } from 'lucide-react';
import countryAPI from '../apis/countryAPI';
import { useSelector } from 'react-redux';


const ManageCountries = () => {
    const { themeColors, changePalette } = useTheme();

    const auth = useSelector((state) => state.auth.user);
    const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        isActive: true
    });
    const [errors, setErrors] = useState({});
    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        const filtered = countries.filter(country =>
            country.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCountries(filtered);
    }, [searchTerm, countries]);

    const fetchCountries = async () => {
        try {
            setLoading(true);
            const response = await countryAPI.getCountries(auth.token);
            setCountries(response.data.data);
            setFilteredCountries(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch countries');
            console.error('Error fetching countries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCountry = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Country name is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await countryAPI.createCountry(formData, auth.token);
            setCountries([...countries, response.data.data]);
            setShowCreateModal(false);
            setFormData({ name: '', isActive: true });
            toast.success('Country created successfully');
        } catch (error) {
            if (error.response?.data?.message === 'Country already exists') {
                setErrors({ name: 'Country already exists' });
            } else {
                toast.error('Failed to create country');
            }
        }
    };

    const handleUpdateCountry = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Country name is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            const response = await countryAPI.updateCountry(
                selectedCountry._id,
                formData,
                auth.token
            );

            const updatedCountries = countries.map(country =>
                country._id === selectedCountry._id ? response.data.data : country
            );

            setCountries(updatedCountries);
            setShowEditModal(false);
            setSelectedCountry(null);
            toast.success('Country updated successfully');
        } catch (error) {
            if (error.response?.data?.message === 'Country name already exists') {
                setErrors({ name: 'Country name already exists' });
            } else {
                toast.error('Failed to update country');
            }
        }
    };

    const handleDeleteCountry = async (id) => {
        if (!window.confirm('Are you sure you want to delete this country?')) return;

        try {
            await countryAPI.deleteCountry(id, auth.token);
            const updatedCountries = countries.filter(country => country._id !== id);
            setCountries(updatedCountries);
            toast.success('Country deleted successfully');
        } catch (error) {
            toast.error('Failed to delete country');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const response = await countryAPI.toggleCountryStatus(id, auth.token);
            const updatedCountries = countries.map(country =>
                country._id === id ? response.data.data : country
            );
            setCountries(updatedCountries);
            toast.success(`Country ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
            toast.error('Failed to update country status');
        }
    };

    const openEditModal = (country) => {
        setSelectedCountry(country);
        setFormData({
            name: country.name,
            isActive: country.isActive
        });
        setErrors({});
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedCountry(null);
        setFormData({ name: '', isActive: true });
        setErrors({});
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
                <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, boxShadow: `0 2px 16px ${themeColors.primary}10` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage Countries</h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = themeColors.active.background}
                    onMouseLeave={e => e.currentTarget.style.background = themeColors.primary}
                >
                    <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
                    Add Country
                </button>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Grid View</button>
                    <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Table View</button>
                </div>
            </div>

            <div style={{ marginBottom: 24 }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 20, width: 20, opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: 40, paddingRight: 16, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, outline: 'none', fontSize: 16, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* Grid/Table View Toggle */}
            {viewType === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {filteredCountries.length === 0 ? (
                        <div style={{ padding: '24px 0', textAlign: 'center', color: themeColors.text, border: `1px solid ${themeColors.border}`, borderRadius: 10, background: themeColors.background, gridColumn: '1/-1' }}>No countries found</div>
                    ) : (
                        filteredCountries.map((country) => (
                            <div key={country._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
                                <div className='flex items-center justify-between'>
                                    <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 20, marginBottom: 4, textShadow: `0 1px 4px ${themeColors.primary}22` }}>{country.name}</div>
                                    <div style={{ fontWeight: 400, color: themeColors.primary, fontSize: 20, marginBottom: 4, textShadow: `0 1px 4px ${themeColors.primary}22` }}>ID-{country.countryId || "NA"}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                                    <span style={{ padding: '2px 10px', fontSize: 14, fontWeight: 600, borderRadius: 8, background: country.isActive ? themeColors.success : themeColors.danger, color: country.isActive ? themeColors.text : themeColors.surface, boxShadow: `0 1px 4px ${themeColors.success}22` }}>{country.isActive ? 'Active' : 'Inactive'}</span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleToggleStatus(country._id)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>{country.isActive ? 'Deactivate' : 'Activate'}</button>
                                        <button onClick={() => openEditModal(country)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                                        <button onClick={() => handleDeleteCountry(country._id)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div style={{ overflowX: 'auto', width: '100%', maxWidth: '100vw' }}>
                    <table style={{ minWidth: '100%', background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 10 }}>
                        <thead>
                            <tr style={{ background: themeColors.surface }}>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: themeColors.text, textTransform: 'uppercase', letterSpacing: 1 }}>S.No.</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: themeColors.text, textTransform: 'uppercase', letterSpacing: 1 }}>ID</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: themeColors.text, textTransform: 'uppercase', letterSpacing: 1 }}>Name</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: themeColors.text, textTransform: 'uppercase', letterSpacing: 1 }}>Status</th>
                                <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: themeColors.text, textTransform: 'uppercase', letterSpacing: 1 }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCountries.length === 0 ? (
                                <tr>
                                    <td colSpan="3" style={{ padding: '16px 24px', textAlign: 'center', color: themeColors.text }}>No countries found</td>
                                </tr>
                            ) : (
                                filteredCountries.map((country,index) => (
                                    <tr key={country._id} style={{ transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.background}>
                                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 700, color: themeColors.primary, fontSize: 16, textShadow: `0 1px 4px ${themeColors.primary}22` }}>{index}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 700, color: themeColors.primary, fontSize: 16, textShadow: `0 1px 4px ${themeColors.primary}22` }}>{country.countryId}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                            <span style={{ fontWeight: 700, color: themeColors.primary, fontSize: 16, textShadow: `0 1px 4px ${themeColors.primary}22` }}>{country.name}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                                            <span style={{ padding: '2px 10px', fontSize: 14, fontWeight: 600, borderRadius: 8, background: country.isActive ? themeColors.success : themeColors.danger, color: country.isActive ? themeColors.text : themeColors.surface, boxShadow: `0 1px 4px ${themeColors.success}22` }}>{country.isActive ? 'Active' : 'Inactive'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', fontSize: 14, fontWeight: 500 }}>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => handleToggleStatus(country._id)} style={{ color: themeColors.text, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = themeColors.primary} onMouseLeave={e => e.currentTarget.style.color = themeColors.text} title={country.isActive ? 'Deactivate' : 'Activate'}>{country.isActive ? <EyeOff style={{ height: 16, width: 16 }} /> : <Eye style={{ height: 16, width: 16 }} />}</button>
                                                <button onClick={() => openEditModal(country)} style={{ color: themeColors.primary, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = themeColors.active.text} onMouseLeave={e => e.currentTarget.style.color = themeColors.primary} title="Edit"><Pencil style={{ height: 16, width: 16 }} /></button>
                                                <button onClick={() => handleDeleteCountry(country._id)} style={{ color: themeColors.danger, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = themeColors.active.background} onMouseLeave={e => e.currentTarget.style.color = themeColors.danger} title="Delete"><Trash2 style={{ height: 16, width: 16 }} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create Country Modal */}
            {showCreateModal && (
                <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
                    <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
                        <div style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary, textShadow: `0 1px 4px ${themeColors.primary}22` }}>Add New Country</h2>
                            <form onSubmit={handleCreateCountry}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>Country Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                                        placeholder="Enter country name"
                                    />
                                    {errors.name && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.name}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }}
                                    />
                                    <label htmlFor="isActive" style={{ fontSize: 15, color: themeColors.text }}>Active</label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}`, cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background}
                                        onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = themeColors.active.background}
                                        onMouseLeave={e => e.currentTarget.style.background = themeColors.primary}
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Country Modal */}
            {showEditModal && selectedCountry && (
                <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
                    <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
                        <div style={{ padding: 24 }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary, textShadow: `0 1px 4px ${themeColors.primary}22` }}>Edit Country</h2>
                            <form onSubmit={handleUpdateCountry}>
                                <div style={{ marginBottom: 16 }}>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>Country Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                                        placeholder="Enter country name"
                                    />
                                    {errors.name && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.name}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    <input
                                        type="checkbox"
                                        id="editIsActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }}
                                    />
                                    <label htmlFor="editIsActive" style={{ fontSize: 15, color: themeColors.text }}>Active</label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                                    <button
                                        type="button"
                                        onClick={closeModals}
                                        style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}`, cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background}
                                        onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 500, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = themeColors.active.background}
                                        onMouseLeave={e => e.currentTarget.style.background = themeColors.primary}
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCountries;