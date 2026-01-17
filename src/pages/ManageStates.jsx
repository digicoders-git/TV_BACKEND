// src/components/ManageStates.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
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
import stateAPI from '../apis/stateAPI';
import countryAPI from '../apis/countryAPI';
import { useSelector } from 'react-redux';

const ManageStates = () => {
  const { themeColors } = useTheme();

  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const [states, setStates] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    status: 'all' // all, active, inactive
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedState, setSelectedState] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStates();
  }, [searchTerm, filters, states]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStates(), fetchCountries()]);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await stateAPI.getStates({}, token);
      setStates(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch states');
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await countryAPI.getCountries(token);
      setCountries(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch countries');
    }
  };

  const filterStates = () => {
    let filtered = states;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(state =>
        state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        state.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by country
    if (filters.country) {
      filtered = filtered.filter(state => state.country._id === filters.country);
    }

    // Filter by status
    if (filters.status === 'active') {
      filtered = filtered.filter(state => state.isActive);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(state => !state.isActive);
    }

    setFilteredStates(filtered);
  };

  const handleCreateState = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'State name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const response = await stateAPI.createState(formData, token);
      setStates([...states, response.data.data]);
      setShowCreateModal(false);
      setFormData({ name: '', country: '', isActive: true });
      toast.success('State created successfully');
      fetchStates()
    } catch (error) {
      if (error.response?.data?.message === 'State already exists in this country') {
        setErrors({ name: 'State already exists in this country' });
      } else {
        toast.error('Failed to create state');
      }
    }
  };

  const handleUpdateState = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'State name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      const response = await stateAPI.updateState(
        selectedState._id, 
        formData, 
        token
      );
      
      const updatedStates = states.map(state =>
        state._id === selectedState._id ? response.data.data : state
      );
      
      setStates(updatedStates);
      setShowEditModal(false);
      setSelectedState(null);
      toast.success('State updated successfully');
    } catch (error) {
      if (error.response?.data?.message === 'State with this name already exists in the country') {
        setErrors({ name: 'State name already exists in this country' });
      } else {
        toast.error('Failed to update state');
      }
    }
  };

  const handleDeleteState = async (id) => {
    if (!window.confirm('Are you sure you want to delete this state?')) return;
    
    try {
      await stateAPI.deleteState(id, token);
      const updatedStates = states.filter(state => state._id !== id);
      setStates(updatedStates);
      toast.success('State deleted successfully');
    } catch (error) {
      toast.error('Failed to delete state');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await stateAPI.toggleStateStatus(id, token);
      const updatedStates = states.map(state =>
        state._id === id ? response.data.data : state
      );
      // setStates(updatedStates);
      fetchStates()
      toast.success(`State ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update state status');
    }
  };

  const openEditModal = (state) => {
    setSelectedState(state);
    setFormData({
      name: state.name,
      country: state.country._id,
      isActive: state.isActive
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedState(null);
    setFormData({ name: '', country: '', isActive: true });
    setErrors({});
  };

  const resetFilters = () => {
    setFilters({ country: '', status: 'all' });
    setSearchTerm('');
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage States</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = themeColors.active.background}
          onMouseLeave={e => e.currentTarget.style.background = themeColors.primary}
        >
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Add State
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Grid View</button>
          <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Table View</button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input
            type="text"
            placeholder="Search states or countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }}
          />
        </div>

        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>
          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
                >
                  <option value="">All Countries</option>
                  {countries.map(country => (
                    <option key={country._id} value={country._id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <button
                  onClick={resetFilters}
                  style={{ padding: '8px 12px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid/Table View Toggle */}
      {viewType === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {filteredStates.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background }}>No states found</div>
          ) : (
            filteredStates.map((state) => (
              <div key={state._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
                <div className='flex items-start justify-between'>
                <div>
                  <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 20, marginBottom: 4, textShadow: `0 1px 4px ${themeColors.primary}22` }}>{state.name}</div>
                  <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>Country: <span style={{ fontWeight: 600, color: themeColors.accent }}>{state.country?.name || 'N/A'}</span></div>
                </div>
                  <div style={{ fontWeight: 400, color: themeColors.primary, fontSize: 20, marginBottom: 4, textShadow: `0 1px 4px ${themeColors.primary}22` }}>ID-{state.stateId || "NA"}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span style={{ padding: '2px 10px', fontSize: 14, fontWeight: 600, borderRadius: 8, background: state.isActive ? themeColors.success : themeColors.danger, color: state.isActive ? themeColors.text : themeColors.surface, boxShadow: `0 1px 4px ${themeColors.success}22` }}>{state.isActive ? 'Active' : 'Inactive'}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleToggleStatus(state._id)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>{state.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button onClick={() => openEditModal(state)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                    <button onClick={() => handleDeleteState(state._id)} style={{ padding: '4px 8px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={e => e.currentTarget.style.background = themeColors.surface}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: themeColors.background }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>S.No.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>ID</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Country</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStates.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: 24, textAlign: 'center', color: themeColors.text, borderTop: `1px solid ${themeColors.border}` }}>No states found</td>
                </tr>
              ) : (
                filteredStates.map((state, index) => (
                  <tr key={state._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: themeColors.text }}>{index}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: themeColors.text }}>{state.stateId || "NA"}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600, color: themeColors.text }}>{state.name}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{state.country?.name || 'N/A'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: state.isActive ? themeColors.success : themeColors.danger, color: state.isActive ? themeColors.text : themeColors.surfaceLight }}>{state.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handleToggleStatus(state._id)} style={{ color: themeColors.text }} title={state.isActive ? 'Deactivate' : 'Activate'}>
                          {state.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}
                        </button>
                        <button onClick={() => openEditModal(state)} style={{ color: themeColors.primary }} title="Edit">
                          <Pencil style={{ height: 16, width: 16, color: themeColors.primary }} />
                        </button>
                        <button onClick={() => handleDeleteState(state._id)} style={{ color: themeColors.danger }} title="Delete">
                          <Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create State Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary, textShadow: `0 1px 4px ${themeColors.primary}22` }}>Add New State</h2>
              <form onSubmit={handleCreateState}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>State Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                    placeholder="Enter state name"
                  />
                  {errors.name && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.name}</p>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country._id} value={country._id}>{country.name}</option>
                    ))}
                  </select>
                  {errors.country && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.country}</p>}
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

      {/* Edit State Modal */}
      {showEditModal && selectedState && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary, textShadow: `0 1px 4px ${themeColors.primary}22` }}>Edit State</h2>
              <form onSubmit={handleUpdateState}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>State Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                    placeholder="Enter state name"
                  />
                  {errors.name && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.name}</p>}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, boxSizing: 'border-box' }}
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country._id} value={country._id}>{country.name}</option>
                    ))}
                  </select>
                  {errors.country && <p style={{ marginTop: 4, fontSize: 13, color: themeColors.danger }}>{errors.country}</p>}
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

export default ManageStates;