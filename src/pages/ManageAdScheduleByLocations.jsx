import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Filter, ChevronDown, ChevronUp, Search, Info, X, MapPin, Tv, Building, Map, Globe, Landmark, RefreshCw, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import scheduleAdAPI from '../apis/scheduleAdAPI';
import adAPI from '../apis/adAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import cityAPI from '../apis/cityAPI';
import zoneAPI from '../apis/zoneAPI';
import storeAPI from '../apis/storeAPI';

const ManageAdScheduleByLocations = () => {
    const { themeColors } = useTheme();
    const auth = useSelector((state) => state.auth.user);
    const token = auth?.token;
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [ads, setAds] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [zones, setZones] = useState([]);
    const [stores, setStores] = useState([]);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        ad: '',
        adSearch: '',
        advertiserFilter: '',
        locationType: '', // 'countries', 'states', 'cities', 'zones', or 'stores'
        locationIds: [],
        validFrom: '',
        validTo: '',
        repeatInADay: 1,
        priority: 1,
        isActive: true
    });

    const [errors, setErrors] = useState({});
    const [filters, setFilters] = useState({
        country: '',
        state: '',
        city: '',
        zone: ''
    });

    const [playTimeOptions, setPlayTimeOptions] = useState([]);
    const [selectedPlayTimes, setSelectedPlayTimes] = useState([]);

    // Add this useEffect to generate playtime options
    useEffect(() => {
        // Generate playtime options (every 5 minutes from 00:00 to 23:55)
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 5) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                times.push(timeString);
            }
        }
        setPlayTimeOptions(times);
    }, []);

    // Add this function to handle playtime selection
    const handlePlayTimeChange = (time, isChecked) => {
        setSelectedPlayTimes(prev =>
            isChecked
                ? [...prev, time]
                : prev.filter(t => t !== time)
        );
    };

    // Add this function to select/deselect all times
    const toggleAllPlayTimes = (selectAll) => {
        if (selectAll) {
            setSelectedPlayTimes([...playTimeOptions]);
        } else {
            setSelectedPlayTimes([]);
        }
    };


    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (filters.country) {
            fetchStates(filters.country);
        } else {
            setStates([]);
            setFilters(prev => ({ ...prev, state: '', city: '', zone: '' }));
        }
    }, [filters.country]);

    useEffect(() => {
        if (filters.state) {
            fetchCities(filters.state);
        } else {
            setCities([]);
            setFilters(prev => ({ ...prev, city: '', zone: '' }));
        }
    }, [filters.state]);

    useEffect(() => {
        if (filters.city) {
            fetchZones(filters.city);
        } else {
            setZones([]);
            setFilters(prev => ({ ...prev, zone: '' }));
        }
    }, [filters.city]);

    useEffect(() => {
        if (filters.zone) {
            fetchStores(filters.zone);
        } else {
            setStores([]);
        }
    }, [filters.zone]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [adsRes, countriesRes] = await Promise.all([
                adAPI.getUnScheduledAds({}, token),
                countryAPI.getActiveCountries()
            ]);
            setAds(adsRes.data.data || []);
            setCountries(countriesRes.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch initial data');
        } finally {
            setLoading(false);
        }
    };

    const fetchStates = async (countryId) => {
        try {
            const res = await stateAPI.getActiveStates(countryId);
            setStates(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch states');
        }
    };

    const fetchCities = async (stateId) => {
        try {
            const res = await cityAPI.getActiveCities({ state: stateId });
            setCities(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch cities');
        }
    };

    const fetchZones = async (cityId) => {
        try {
            const res = await zoneAPI.getActiveZones({ city: cityId });
            setZones(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch zones');
        }
    };

    const fetchStores = async (zoneId) => {
        try {
            const res = await storeAPI.getActiveStores({ zone: zoneId });
            setStores(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch stores');
        }
    };

    const getTVsPreview = async () => {
        try {
            setPreviewLoading(true);

            // Prepare payload based on selected location type
            const payload = {

            };

            // Add the appropriate location field based on selected type
            if (formData.locationType) {
                payload[formData.locationType] = formData.locationIds;
            }

            const res = await scheduleAdAPI.getTVsCountByLocations(payload, token);
            setPreviewData(res.data.data);
            setShowPreviewModal(true);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to get TVs preview');
        } finally {
            setPreviewLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.ad) newErrors.ad = 'Ad selection is required';
        if (!formData.validFrom) newErrors.validFrom = 'Valid From is required';
        if (!formData.validTo) newErrors.validTo = 'Valid To is required';
        if (
            formData.validFrom &&
            formData.validTo &&
            new Date(formData.validFrom) > new Date(formData.validTo)
        ) {
            newErrors.validTo = 'Valid To must be same or after Valid From';
        }

        // Check if a location type is selected and has at least one location
        if (!formData.locationType) {
            newErrors.locationType = 'Please select a location type';
        } else if (formData.locationIds.length === 0) {
            newErrors.locationIds = 'Please select at least one location';
        }

        if (selectedPlayTimes.length === 0) {
            newErrors.playTimes = 'Please select at least one play time';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateSchedule = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            setCreating(true);

            // Prepare payload based on selected location type
            const payload = {
                ad: formData.ad,
                validFrom: new Date(formData.validFrom),
                validTo: new Date(formData.validTo),
                repeatInADay: formData.repeatInADay,
                priority: formData.priority,
                isActive: formData.isActive,
                playTimes: selectedPlayTimes // Add playTimes to payload
            };

            // Add the appropriate location field based on selected type
            if (formData.locationType) {
                payload[formData.locationType] = formData.locationIds;
            }

            const res = await scheduleAdAPI.createAdScheduleByLocations(payload, token);
            toast.success(`Schedule created successfully for ${res.data.data.tvCount} TVs`);
            setShowCreateModal(false);
            resetForm();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create schedule');
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setFormData({
            ad: '',
            adSearch: '',
            advertiserFilter: '',
            locationType: '',
            locationIds: [],
            validFrom: '',
            validTo: '',
            repeatInADay: 1,
            priority: 1,
            isActive: true
        });
        setSelectedPlayTimes([]); // Clear playtimes
        setFilters({
            country: '',
            state: '',
            city: '',
            zone: ''
        });
    };

    const toggleLocationSelection = (id) => {
        setFormData(prev => ({
            ...prev,
            locationIds: prev.locationIds.includes(id)
                ? prev.locationIds.filter(item => item !== id)
                : [...prev.locationIds, id]
        }));
    };

    const selectAllLocations = (items) => {
        const allIds = items.map(item => item._id);
        setFormData(prev => ({
            ...prev,
            locationIds: prev.locationIds.length === allIds.length ? [] : allIds
        }));
    };

    const getCurrentLocationItems = () => {
        switch (formData.locationType) {
            case 'countries': return countries;
            case 'states': return states;
            case 'cities': return cities;
            case 'zones': return zones;
            case 'stores': return stores;
            default: return [];
        }
    };

    const getLocationIcon = () => {
        switch (formData.locationType) {
            case 'countries': return <Globe size={18} />;
            case 'states': return <Map size={18} />;
            case 'cities': return <Landmark size={18} />;
            case 'zones': return <MapPin size={18} />;
            case 'stores': return <Building size={18} />;
            default: return <MapPin size={18} />;
        }
    };

    const getLocationTitle = () => {
        switch (formData.locationType) {
            case 'countries': return 'Countries';
            case 'states': return 'States';
            case 'cities': return 'Cities';
            case 'zones': return 'Zones';
            case 'stores': return 'Stores';
            default: return 'Select Location Type';
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                        onClick={() => navigate('/dashboard/manage-ad-schedules')}
                        style={{
                            padding: 8,
                            borderRadius: 8,
                            border: `1px solid ${themeColors.border}`,
                            background: themeColors.background,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <ArrowLeft style={{ height: 20, width: 20, color: themeColors.text }} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: themeColors.primary }}>Schedule by Locations</h1>
                        <p style={{ color: themeColors.textSecondary, marginTop: 4 }}>
                            Schedule ads across multiple locations of the same type
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                        background: themeColors.primary,
                        color: themeColors.surface,
                        padding: '12px 20px',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    <Plus size={20} />
                    Create Schedule
                </button>
            </div>

            {/* Instructions */}
            <div style={{
                background: `${themeColors.primary}10`,
                border: `1px solid ${themeColors.primary}30`,
                borderRadius: 12,
                padding: 20,
                marginBottom: 24
            }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <Info style={{ color: themeColors.primary, flexShrink: 0, marginTop: 2 }} size={20} />
                    <div>
                        <h3 style={{ color: themeColors.primary, marginBottom: 8, fontWeight: 600 }}>How it works</h3>
                        <p style={{ color: themeColors.text, lineHeight: 1.6 }}>
                            Select one location type (Country, State, City, Zone, or Store) and choose multiple locations of that type.
                            The system will automatically find all TVs in the selected locations and create a schedule for them.
                        </p>
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    zIndex: 1000
                }}>
                    <div style={{
                        background: themeColors.surface,
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 1000,
                        maxHeight: '90vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: 24,
                            borderBottom: `1px solid ${themeColors.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ fontSize: 24, fontWeight: 700, color: themeColors.primary }}>Create Schedule by Locations</h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                            >
                                <X style={{ color: themeColors.text }} size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                            <form onSubmit={handleCreateSchedule} style={{ display: 'grid', gap: 24 }}>
                                {/* Ad Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 12 }}>Select Ad *</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <input
                                            type="text"
                                            placeholder="Search ads by title or ID..."
                                            value={formData.adSearch}
                                            onChange={(e) => setFormData({ ...formData, adSearch: e.target.value })}
                                            style={{
                                                padding: '12px 16px',
                                                border: `1px solid ${errors.ad ? themeColors.danger : themeColors.border}`,
                                                borderRadius: 8,
                                                background: themeColors.background,
                                                color: themeColors.text
                                            }}
                                        />

                                        <div
                                            style={{
                                                border: `1px solid ${errors.ad ? themeColors.danger : themeColors.border}`,
                                                borderRadius: 8,
                                                maxHeight: 300,
                                                overflowY: 'auto',
                                                padding: 12,
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', // responsive grid
                                                gap: 12
                                            }}
                                        >
                                            {ads
                                                .filter(ad =>
                                                    ad.title?.toLowerCase().includes(formData.adSearch.toLowerCase()) ||
                                                    ad.adId?.toLowerCase().includes(formData.adSearch.toLowerCase())
                                                )
                                                .map(ad => (
                                                    <label
                                                        key={ad._id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'flex-start',
                                                            gap: 12,
                                                            padding: '12px 8px',
                                                            borderRadius: 6,
                                                            background: formData.ad === ad._id ? `${themeColors.primary}20` : 'transparent',
                                                            border: `1px solid ${formData.ad === ad._id ? themeColors.primary : themeColors.border}`,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="ad"
                                                            value={ad._id}
                                                            checked={formData.ad === ad._id}
                                                            onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                                                            style={{ accentColor: themeColors.primary, marginTop: 4 }}
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: themeColors.text }}>{ad.title}</div>
                                                            <div style={{ fontSize: 12, color: themeColors.textSecondary }}>
                                                                ID: {ad.adId} • {ad.advertiser?.name}
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                        </div>

                                        {errors.ad && <span style={{ color: themeColors.danger, fontSize: 14 }}>{errors.ad}</span>}
                                    </div>
                                </div>

                                {/* Location Type Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 12 }}>Select Location Type *</label>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: 12,
                                        marginBottom: 16
                                    }}>
                                        {[
                                            { value: 'countries', label: 'Countries', icon: <Globe size={16} /> },
                                            { value: 'states', label: 'States', icon: <Map size={16} /> },
                                            { value: 'cities', label: 'Cities', icon: <Landmark size={16} /> },
                                            { value: 'zones', label: 'Zones', icon: <MapPin size={16} /> },
                                            { value: 'stores', label: 'Stores', icon: <Building size={16} /> }
                                        ].map((type) => (
                                            <label key={type.value} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 8,
                                                padding: '16px 12px',
                                                borderRadius: 8,
                                                background: formData.locationType === type.value ? `${themeColors.primary}20` : themeColors.background,
                                                border: `2px solid ${formData.locationType === type.value ? themeColors.primary : themeColors.border}`,
                                                cursor: 'pointer',
                                                textAlign: 'center'
                                            }}>
                                                <input
                                                    type="radio"
                                                    name="locationType"
                                                    value={type.value}
                                                    checked={formData.locationType === type.value}
                                                    onChange={(e) => {
                                                        setFormData({
                                                            ...formData,
                                                            locationType: e.target.value,
                                                            locationIds: []
                                                        });
                                                    }}
                                                    style={{ display: 'none' }}
                                                />
                                                {type.icon}
                                                <span style={{ fontSize: 14, fontWeight: 600, color: themeColors.text }}>{type.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.locationType && <span style={{ color: themeColors.danger, fontSize: 14 }}>{errors.locationType}</span>}
                                </div>

                                {/* Location Filter and Selection */}
                                {formData.locationType && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 12 }}>
                                            Select {getLocationTitle()} *
                                        </label>

                                        {/* Filter Bar - Only show relevant filters based on location type */}
                                        {formData.locationType !== 'countries' && (
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                                gap: 12,
                                                marginBottom: 16,
                                                padding: 16,
                                                background: themeColors.background,
                                                borderRadius: 8,
                                                border: `1px solid ${themeColors.border}`
                                            }}>
                                                {formData.locationType !== 'countries' && (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: themeColors.text }}>Country</label>
                                                        <select
                                                            value={filters.country}
                                                            onChange={(e) => setFilters({ country: e.target.value, state: '', city: '', zone: '' })}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                borderRadius: 6,
                                                                border: `1px solid ${themeColors.border}`,
                                                                backgroundColor: themeColors.background,
                                                                color: themeColors.text,
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                cursor: 'pointer',
                                                                appearance: 'none',
                                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(themeColors.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 8px center',
                                                                backgroundSize: '16px',
                                                                paddingRight: '32px'
                                                            }}
                                                        >
                                                            <option value="" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>All Countries</option>
                                                            {countries.map(country => (
                                                                <option
                                                                    key={country._id}
                                                                    value={country._id}
                                                                    style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                                                                >
                                                                    {country.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {formData.locationType !== 'countries' && formData.locationType !== 'states' && filters.country && (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: themeColors.text }}>State</label>
                                                        <select
                                                            value={filters.state}
                                                            onChange={(e) => setFilters({ ...filters, state: e.target.value, city: '', zone: '' })}
                                                            disabled={!filters.country}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                borderRadius: 6,
                                                                border: `1px solid ${themeColors.border}`,
                                                                backgroundColor: themeColors.background,
                                                                color: themeColors.text,
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                cursor: filters.country ? 'pointer' : 'not-allowed',
                                                                appearance: 'none',
                                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(themeColors.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 8px center',
                                                                backgroundSize: '16px',
                                                                paddingRight: '32px',
                                                                opacity: filters.country ? 1 : 0.6
                                                            }}
                                                        >
                                                            <option value="" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>All States</option>
                                                            {states.map(state => (
                                                                <option
                                                                    key={state._id}
                                                                    value={state._id}
                                                                    style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                                                                >
                                                                    {state.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {formData.locationType !== 'countries' && formData.locationType !== 'states' && formData.locationType !== 'cities' && filters.state && (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: themeColors.text }}>City</label>
                                                        <select
                                                            value={filters.city}
                                                            onChange={(e) => setFilters({ ...filters, city: e.target.value, zone: '' })}
                                                            disabled={!filters.state}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                borderRadius: 6,
                                                                border: `1px solid ${themeColors.border}`,
                                                                backgroundColor: themeColors.background,
                                                                color: themeColors.text,
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                cursor: filters.state ? 'pointer' : 'not-allowed',
                                                                appearance: 'none',
                                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(themeColors.text)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 8px center',
                                                                backgroundSize: '16px',
                                                                paddingRight: '32px',
                                                                opacity: filters.state ? 1 : 0.6
                                                            }}
                                                        >
                                                            <option value="" style={{ backgroundColor: themeColors.background, color: themeColors.text }}>All Cities</option>
                                                            {cities.map(city => (
                                                                <option
                                                                    key={city._id}
                                                                    value={city._id}
                                                                    style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                                                                >
                                                                    {city.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                {formData.locationType !== 'countries' && formData.locationType !== 'states' && formData.locationType !== 'cities' && formData.locationType !== 'zones' && filters.city && (
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: themeColors.text }}>Zone</label>
                                                        <select
                                                            value={filters.zone}
                                                            onChange={(e) => setFilters({ ...filters, zone: e.target.value })}
                                                            disabled={!filters.city}
                                                            style={{
                                                                width: '100%',
                                                                padding: '8px 12px',
                                                                borderRadius: 6,
                                                                border: `1px solid ${themeColors.border}`,
                                                                backgroundColor: themeColors.background,
                                                                color: themeColors.text,
                                                                fontSize: '14px',
                                                                outline: 'none',
                                                                cursor: filters.city ? 'pointer' : 'not-allowed',
                                                                // appearance: 'none',
                                                                WebkitAppearance: 'none',
                                                                MozAppearance: 'none',
                                                                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg 
      xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' 
      stroke='${encodeURIComponent(themeColors.text)}' stroke-width='2' 
      stroke-linecap='round' stroke-linejoin='round'%3e
      %3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                                                                backgroundRepeat: 'no-repeat',
                                                                backgroundPosition: 'right 8px center',
                                                                backgroundSize: '16px',
                                                                paddingRight: '32px',
                                                                opacity: filters.city ? 1 : 0.6
                                                            }}
                                                        >
                                                            <option
                                                                value=""
                                                                style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                                                            >
                                                                All Zones
                                                            </option>
                                                            {zones.map(zone => (
                                                                <option
                                                                    key={zone._id}
                                                                    value={zone._id}
                                                                    style={{ backgroundColor: themeColors.background, color: themeColors.text }}
                                                                >
                                                                    {zone.name}
                                                                </option>
                                                            ))}
                                                        </select>

                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Location Selector */}
                                        <div style={{
                                            border: `1px solid ${errors.locationIds ? themeColors.danger : themeColors.border}`,
                                            borderRadius: 8,
                                            padding: 16,
                                            background: themeColors.background
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {getLocationIcon()}
                                                    <h3 style={{ fontSize: 16, fontWeight: 600, color: themeColors.primary }}>{getLocationTitle()}</h3>
                                                </div>
                                                {getCurrentLocationItems().length > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => selectAllLocations(getCurrentLocationItems())}
                                                        style={{
                                                            fontSize: 12,
                                                            color: themeColors.primary,
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {formData.locationIds.length === getCurrentLocationItems().length ? 'Deselect All' : 'Select All'}
                                                    </button>
                                                )}
                                            </div>

                                            {getCurrentLocationItems().length === 0 ? (
                                                <div style={{ color: themeColors.textSecondary, fontSize: 14, textAlign: 'center', padding: 16 }}>
                                                    No {getLocationTitle().toLowerCase()} available
                                                </div>
                                            ) : (
                                                <div style={{
                                                    maxHeight: 300,
                                                    overflowY: 'auto',
                                                    display: 'grid',
                                                    gap: 8
                                                }}>
                                                    {getCurrentLocationItems().map(item => (
                                                        <label key={item._id} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                            padding: 8,
                                                            borderRadius: 6,
                                                            background: formData.locationIds.includes(item._id) ? `${themeColors.primary}20` : 'transparent',
                                                            border: `1px solid ${formData.locationIds.includes(item._id) ? themeColors.primary : themeColors.border}`,
                                                            cursor: 'pointer'
                                                        }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.locationIds.includes(item._id)}
                                                                onChange={() => toggleLocationSelection(item._id)}
                                                                style={{ accentColor: themeColors.primary }}
                                                            />
                                                            <span style={{ fontSize: 14, color: themeColors.text }}>{item.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {errors.locationIds && (
                                            <span style={{ color: themeColors.danger, fontSize: 14, marginTop: 8, display: 'block' }}>
                                                {errors.locationIds}
                                            </span>
                                        )}

                                        {formData.locationIds.length > 0 && (
                                            <div style={{
                                                marginTop: 12,
                                                padding: 12,
                                                background: `${themeColors.primary}10`,
                                                borderRadius: 8,
                                                border: `1px solid ${themeColors.primary}30`
                                            }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, color: themeColors.primary, marginBottom: 4 }}>
                                                    Selected {getLocationTitle()}: {formData.locationIds.length}
                                                </div>
                                                <div style={{ fontSize: 12, color: themeColors.textSecondary }}>
                                                    {formData.locationIds.map(id => {
                                                        const item = getCurrentLocationItems().find(i => i._id === id);
                                                        return item ? item.name : id;
                                                    }).join(', ')}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* Play Time Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 12 }}>
                                        Select Play Times *
                                    </label>

                                    <div style={{
                                        border: `1px solid ${selectedPlayTimes.length === 0 ? themeColors.danger : themeColors.border}`,
                                        borderRadius: 8,
                                        padding: 16,
                                        background: themeColors.background
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Clock size={18} color={themeColors.primary} />
                                                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.primary }}>Play Times</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllPlayTimes(true)}
                                                    style={{
                                                        fontSize: 12,
                                                        padding: '4px 8px',
                                                        background: themeColors.primary,
                                                        color: themeColors.surface,
                                                        border: 'none',
                                                        borderRadius: 4,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Select All
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleAllPlayTimes(false)}
                                                    style={{
                                                        fontSize: 12,
                                                        padding: '4px 8px',
                                                        background: themeColors.danger,
                                                        color: themeColors.surface,
                                                        border: 'none',
                                                        borderRadius: 4,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                        </div>

                                        {selectedPlayTimes.length > 0 && (
                                            <div style={{
                                                marginBottom: 12,
                                                padding: 8,
                                                background: `${themeColors.primary}10`,
                                                borderRadius: 4
                                            }}>
                                                <span style={{ fontSize: 12, color: themeColors.primary }}>
                                                    Selected: {selectedPlayTimes.length} time(s)
                                                </span>
                                            </div>
                                        )}

                                        <div style={{
                                            maxHeight: 200,
                                            overflowY: 'auto',
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                            gap: 8
                                        }}>
                                            {playTimeOptions.map(time => (
                                                <label key={time} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    padding: '6px 8px',
                                                    borderRadius: 4,
                                                    background: selectedPlayTimes.includes(time)
                                                        ? `${themeColors.primary}20`
                                                        : 'transparent',
                                                    border: `1px solid ${selectedPlayTimes.includes(time)
                                                            ? themeColors.primary
                                                            : themeColors.border
                                                        }`,
                                                    cursor: 'pointer'
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPlayTimes.includes(time)}
                                                        onChange={(e) => handlePlayTimeChange(time, e.target.checked)}
                                                        style={{ accentColor: themeColors.primary }}
                                                    />
                                                    <span style={{ fontSize: 12, color: themeColors.text }}>{time}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {selectedPlayTimes.length === 0 && (
                                            <span style={{ color: themeColors.danger, fontSize: 14, marginTop: 8, display: 'block' }}>
                                                Please select at least one play time
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {/* Schedule Details */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 8 }}>Valid From *</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.validFrom}
                                            onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: `1px solid ${errors.validFrom ? themeColors.danger : themeColors.border}`,
                                                borderRadius: 8,
                                                background: themeColors.background,
                                                color: themeColors.text
                                            }}
                                        />
                                        {errors.validFrom && <span style={{ color: themeColors.danger, fontSize: 14, marginTop: 4, display: 'block' }}>{errors.validFrom}</span>}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 8 }}>Valid To *</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.validTo}
                                            onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: `1px solid ${errors.validTo ? themeColors.danger : themeColors.border}`,
                                                borderRadius: 8,
                                                background: themeColors.background,
                                                color: themeColors.text
                                            }}
                                        />
                                        {errors.validTo && <span style={{ color: themeColors.danger, fontSize: 14, marginTop: 4, display: 'block' }}>{errors.validTo}</span>}
                                    </div>

                                    {/* <div>
                                        <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 8 }}>Repeat per Day</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={formData.repeatInADay}
                                            onChange={(e) => setFormData({ ...formData, repeatInADay: parseInt(e.target.value) })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: `1px solid ${themeColors.border}`,
                                                borderRadius: 8,
                                                background: themeColors.background,
                                                color: themeColors.text
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 8 }}>Priority</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                            style={{
                                                width: '100%',
                                                padding: '12px 16px',
                                                border: `1px solid ${themeColors.border}`,
                                                borderRadius: 8,
                                                background: themeColors.background,
                                                color: themeColors.text
                                            }}
                                        />
                                    </div> */}
                                </div>

                                {/* Status */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        style={{ accentColor: themeColors.primary }}
                                    />
                                    <label htmlFor="isActive" style={{ color: themeColors.text, fontSize: 16 }}>Active Schedule</label>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: 24,
                            borderTop: `1px solid ${themeColors.border}`,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            {/* <button
                                type="button"
                                onClick={getTVsPreview}
                                disabled={previewLoading || !formData.ad || !formData.locationType || formData.locationIds.length === 0}
                                style={{
                                    padding: '12px 24px',
                                    background: themeColors.background,
                                    color: themeColors.text,
                                    border: `1px solid ${themeColors.border}`,
                                    borderRadius: 8,
                                    cursor: (formData.ad && formData.locationType && formData.locationIds.length > 0) ? 'pointer' : 'not-allowed',
                                    opacity: (formData.ad && formData.locationType && formData.locationIds.length > 0) ? 1 : 0.6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8
                                }}
                            >
                                {previewLoading ? <RefreshCw className="animate-spin" size={16} /> : <Tv size={16} />}
                                Preview TVs
                            </button> */}

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: themeColors.background,
                                        color: themeColors.text,
                                        border: `1px solid ${themeColors.border}`,
                                        borderRadius: 8,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCreateSchedule}
                                    disabled={creating}
                                    style={{
                                        padding: '12px 24px',
                                        background: themeColors.primary,
                                        color: themeColors.surface,
                                        border: 'none',
                                        borderRadius: 8,
                                        cursor: 'pointer',
                                        opacity: creating ? 0.7 : 1
                                    }}
                                >
                                    {creating ? 'Creating...' : 'Create Schedule'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {showPreviewModal && previewData && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                    zIndex: 1000
                }}>
                    <div style={{
                        background: themeColors.surface,
                        borderRadius: 16,
                        width: '100%',
                        maxWidth: 800,
                        maxHeight: '90vh',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: 24, borderBottom: `1px solid ${themeColors.border}` }}>
                            <h3 style={{ fontSize: 20, fontWeight: 600, color: themeColors.primary }}>TVs Preview</h3>
                            <p style={{ color: themeColors.textSecondary, marginTop: 4 }}>
                                Found {previewData.totalTVs} TVs in selected locations
                            </p>
                        </div>

                        <div style={{ padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                            {previewData.sampleTVs.length > 0 ? (
                                <div style={{ display: 'grid', gap: 12 }}>
                                    {previewData.sampleTVs.map(tv => (
                                        <div key={tv._id} style={{
                                            padding: 16,
                                            border: `1px solid ${themeColors.border}`,
                                            borderRadius: 8,
                                            background: themeColors.background
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: themeColors.text }}>#{tv.tvId}</div>
                                                    <div style={{ fontSize: 14, color: themeColors.textSecondary, marginTop: 4 }}>
                                                        {tv.store?.name} • {tv.zone?.name} • {tv.city?.name}
                                                    </div>
                                                    {tv.location?.address && (
                                                        <div style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 2 }}>
                                                            {tv.location.address}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        padding: '4px 8px',
                                                        background: tv.status === 'online' ? '#10b98120' : '#ef444420',
                                                        color: tv.status === 'online' ? '#10b981' : '#ef4444',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 600
                                                    }}>
                                                        {tv.status}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
                                                        {tv.screenSize} • {tv.resolution}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: themeColors.textSecondary, padding: 40 }}>
                                    No TVs found in selected locations
                                </div>
                            )}

                            {previewData.totalTVs > 10 && (
                                <div style={{
                                    textAlign: 'center',
                                    color: themeColors.primary,
                                    marginTop: 16,
                                    padding: 12,
                                    background: `${themeColors.primary}10`,
                                    borderRadius: 8
                                }}>
                                    Showing 10 of {previewData.totalTVs} TVs
                                </div>
                            )}
                        </div>

                        <div style={{
                            padding: 24,
                            borderTop: `1px solid ${themeColors.border}`,
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 12
                        }}>
                            <button
                                onClick={() => setShowPreviewModal(false)}
                                style={{
                                    padding: '12px 24px',
                                    background: themeColors.background,
                                    color: themeColors.text,
                                    border: `1px solid ${themeColors.border}`,
                                    borderRadius: 8,
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowPreviewModal(false);
                                }}
                                style={{
                                    padding: '12px 24px',
                                    background: themeColors.primary,
                                    color: themeColors.surface,
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer'
                                }}
                            >
                                Continue to Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAdScheduleByLocations;