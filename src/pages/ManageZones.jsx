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
import zoneAPI from '../apis/zoneAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import cityAPI from '../apis/cityAPI';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';

const ManageZones = () => {
  const { themeColors } = useTheme();
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    state: '',
    city: '',
    status: 'all' // all, active, inactive
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    state: '',
    city: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterZones();
  }, [searchTerm, filters, zones]);

  useEffect(() => {
    // Filter states based on selected country
    if (filters.country) {
      const filtered = states.filter(state => state.country._id === filters.country);
      setFilteredStates(filtered);
    } else {
      setFilteredStates(states);
    }
  }, [filters.country, states]);

  useEffect(() => {
    // Filter cities based on selected state
    if (filters.state) {
      const filtered = cities.filter(city => city.state._id === filters.state);
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [filters.state, cities]);

  useEffect(() => {
    // When country changes in form, reset state and filter states
    if (formData.country) {
      const filtered = states.filter(state => state.country._id === formData.country);
      setFilteredStates(filtered);
      // Reset state selection if it doesn't belong to the new country
      if (formData.state) {
        const currentState = states.find(s => s._id === formData.state);
        if (!currentState || currentState.country._id !== formData.country) {
          setFormData(prev => ({ ...prev, state: '', city: '' }));
        }
      }
    } else {
      setFilteredStates(states);
    }
  }, [formData.country, states]);

  useEffect(() => {
    // When state changes in form, reset city and filter cities
    if (formData.state) {
      const filtered = cities.filter(city => city.state._id === formData.state);
      setFilteredCities(filtered);
      // Reset city selection if it doesn't belong to the new state
      if (formData.city) {
        const currentCity = cities.find(c => c._id === formData.city);
        if (!currentCity || currentCity.state._id !== formData.state) {
          setFormData(prev => ({ ...prev, city: '' }));
        }
      }
    } else {
      setFilteredCities(cities);
    }
  }, [formData.state, cities]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchZones(), fetchCountries(), fetchStates(), fetchCities()]);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await zoneAPI.getZones({}, token);
      setZones(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch zones');
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

  const fetchStates = async () => {
    try {
      const response = await stateAPI.getStates({}, token);
      setStates(response.data.data);
      setFilteredStates(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch states');
    }
  };

  const fetchCities = async () => {
    try {
      const response = await cityAPI.getCities({}, token);
      setCities(response.data.data);
      setFilteredCities(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch cities');
    }
  };

  const filterZones = () => {
    let filtered = zones;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(zone =>
        zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.state?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by country
    if (filters.country) {
      filtered = filtered.filter(zone => zone.country._id === filters.country);
    }

    // Filter by state
    if (filters.state) {
      filtered = filtered.filter(zone => zone.state._id === filters.state);
    }

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(zone => zone.city._id === filters.city);
    }

    // Filter by status
    if (filters.status === 'active') {
      filtered = filtered.filter(zone => zone.isActive);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(zone => !zone.isActive);
    }

    setFilteredZones(filtered);
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Zone name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await zoneAPI.createZone(formData, token);
      setZones([...zones, response.data.data]);
      setShowCreateModal(false);
      setFormData({ name: '', country: '', state: '', city: '', isActive: true });
      toast.success('Zone created successfully');
      fetchZones();
    } catch (error) {
      if (error.response?.data?.message === 'Zone already exists in this city') {
        setErrors({ name: 'Zone already exists in this city' });
      } else if (error.response?.data?.message === 'State not found or doesn\'t belong to the specified country') {
        setErrors({ state: 'State does not belong to the selected country' });
      } else if (error.response?.data?.message === 'City not found or doesn\'t belong to the specified state') {
        setErrors({ city: 'City does not belong to the selected state' });
      } else {
        toast.error('Failed to create zone');
      }
    }
  };

  const handleUpdateZone = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Zone name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await zoneAPI.updateZone(
        selectedZone._id,
        formData,
        token
      );

      const updatedZones = zones.map(zone =>
        zone._id === selectedZone._id ? response.data.data : zone
      );

      setZones(updatedZones);
      setShowEditModal(false);
      setSelectedZone(null);
      toast.success('Zone updated successfully');
      fetchZones();
    } catch (error) {
      if (error.response?.data?.message === 'Zone with this name already exists in the city') {
        setErrors({ name: 'Zone name already exists in this city' });
      } else if (error.response?.data?.message === 'State not found or doesn\'t belong to the specified country') {
        setErrors({ state: 'State does not belong to the selected country' });
      } else if (error.response?.data?.message === 'City not found or doesn\'t belong to the specified state') {
        setErrors({ city: 'City does not belong to the selected state' });
      } else {
        toast.error('Failed to update zone');
      }
    }
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;

    try {
      await zoneAPI.deleteZone(id, token);
      const updatedZones = zones.filter(zone => zone._id !== id);
      setZones(updatedZones);
      toast.success('Zone deleted successfully');
      fetchZones();
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await zoneAPI.toggleZoneStatus(id, token);
      const updatedZones = zones.map(zone =>
        zone._id === id ? response.data.data : zone
      );
      // setZones(updatedZones);
      fetchZones();
      toast.success(`Zone ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update zone status');
    }
  };

  const openEditModal = (zone) => {
    setSelectedZone(zone);
    setFormData({
      name: zone.name,
      country: zone.country._id,
      state: zone.state._id,
      city: zone.city._id,
      isActive: zone.isActive
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedZone(null);
    setFormData({ name: '', country: '', state: '', city: '', isActive: true });
    setErrors({});
  };

  const resetFilters = () => {
    setFilters({ country: '', state: '', city: '', status: 'all' });
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22` }}>Manage Zones</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
          onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
        >
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Add Zone
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer' }}>Grid View</button>
          <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer' }}>Table View</button>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search zones, cities, states, or countries..." style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }} />
        </div>

        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters((s) => !s)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>

          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, state: '', city: '' })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Countries</option>
                  {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value, city: '' })} disabled={!filters.country} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All States</option>
                  {states.filter((s) => !filters.country || s.country._id === filters.country).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} disabled={!filters.state} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Cities</option>
                  {cities.filter((c) => !filters.state || c.state._id === filters.state).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
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
          {filteredZones.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background }}>No zones found</div>
          ) : filteredZones.map((zone) => (
            <div key={zone._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
              <div className='flex items-start justify-between'>
              <div>
                <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 18, marginBottom: 6 }}>{zone.name}</div>
                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>City: <span style={{ fontWeight: 600, color: themeColors.accent }}>{zone.city?.name || 'N/A'}</span></div>
                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>State: <span style={{ fontWeight: 600, color: themeColors.accent }}>{zone.state?.name || 'N/A'}</span></div>
                <div style={{ fontSize: 13, color: themeColors.text }}>Country: <span style={{ fontWeight: 600, color: themeColors.accent }}>{zone.country?.name || 'N/A'}</span></div>
              </div>
                <div style={{ fontWeight: 400, color: themeColors.primary, fontSize: 18, marginBottom: 6 }}>ID-{zone.zoneId || "NA"}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: zone.isActive ? themeColors.success : themeColors.danger, color: zone.isActive ? themeColors.text : themeColors.surfaceDark, boxShadow: zone.isActive ? `0 1px 4px ${themeColors.success}22` : `0 1px 4px ${themeColors.danger}22` }}>{zone.isActive ? 'Active' : 'Inactive'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleToggleStatus(zone._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>{zone.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEditModal(zone)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                  <button onClick={() => handleDeleteZone(zone._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Delete</button>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>City</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>State</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Country</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredZones.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 16, textAlign: 'center', color: themeColors.text }}>No zones found</td></tr>
              ) : filteredZones.map((zone,index) => (
                <tr key={zone._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>{index}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>{zone.zoneId || "NA"}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>{zone.name}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{zone.city?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{zone.state?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{zone.country?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: zone.isActive ? themeColors.success : themeColors.danger, color: zone.isActive ? themeColors.text : themeColors.surfaceDark, boxShadow: zone.isActive ? `0 1px 4px ${themeColors.success}22` : `0 1px 4px ${themeColors.danger}22` }}>{zone.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleToggleStatus(zone._id)} title={zone.isActive ? 'Deactivate' : 'Activate'} style={{ color: themeColors.text }}>{zone.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}</button>
                      <button onClick={() => openEditModal(zone)} title="Edit" style={{ color: themeColors.primary }}><Pencil style={{ height: 16, width: 16, color: themeColors.primary }} /></button>
                      <button onClick={() => handleDeleteZone(zone._id)} title="Delete" style={{ color: themeColors.danger }}><Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} /></button>
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
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Add New Zone</h2>
              <form onSubmit={handleCreateZone}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.text, marginBottom: 6 }}>Zone Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter zone name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.text, marginBottom: 6 }}>Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.text, marginBottom: 6 }}>State</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.text, marginBottom: 6 }}>City</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.city ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.city && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.city}</p>}
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
      {showEditModal && selectedZone && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 400 }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Edit Zone</h2>
              <form onSubmit={handleUpdateZone}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Zone Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter zone name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.city ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.city && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.city}</p>}
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

export default ManageZones;