// src/components/AdLogsViewer.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Search,
    Filter,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    Play,
    Pause,
    Clock,
    Tv,
    BarChart3,
    Download,
    Eye,
    Calendar,
    AlertCircle,
    CheckCircle,
    XCircle
} from 'lucide-react';
import adLogAPI from '../apis/adLogAPI';
import { useTheme } from '../context/ThemeContext';
import { useSelector } from 'react-redux';

const AdLogsViewer = () => {
    const { themeColors } = useTheme();
    const auth = useSelector((state) => state.auth.user);
    const token = auth?.token;

    // State management
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        completionStatus: 'all',
        adTitle: '',
        tvId: '',
        startDate: '',
        endDate: '',
        sortBy: 'createdAt',
        sortOrder: 'desc'
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        limit: 50,
        totalPages: 1,
        totalCount: 0
    });
    const [stats, setStats] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [viewType, setViewType] = useState('table');

    // Fetch data on component mount and filter changes
    useEffect(() => {
        fetchAdLogs();
    }, [filters, pagination.currentPage, pagination.limit]);

    // Main API call function
    const fetchAdLogs = async () => {
        try {
            setLoading(true);
            const params = {
                ...filters,
                page: pagination.currentPage,
                limit: pagination.limit,
                includeStats: 'true',
                includeDurationAnalysis: 'true'
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === 'all') {
                    delete params[key];
                }
            });

            const response = await adLogAPI.getAdLogs(params, token);

            if (response.data.success) {
                setLogs(response.data.data.logs);
                setPagination(response.data.data.pagination);
                setStats(response.data.data.stats);
            }
        } catch (error) {
            console.error('Error fetching ad logs:', error);
            toast.error('Failed to fetch ad logs');
        } finally {
            setLoading(false);
        }
    };

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on filter change
    };

    // Handle pagination
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            search: '',
            completionStatus: 'all',
            adTitle: '',
            tvId: '',
            startDate: '',
            endDate: '',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' // FIX timezone
        });
    };

    // Get status badge color and icon
    const getStatusConfig = (log) => {
        const status = log.enhancedCompletion?.status;
        const reason = log.enhancedCompletion?.reason;

        switch (status) {
            case 'completed':
                return {
                    color: themeColors.success,
                    icon: CheckCircle,
                    text: 'Completed',
                    bgColor: `${themeColors.success}20`
                };
            case 'uncompleted':
                switch (reason) {
                    case 'not_played':
                        return {
                            color: themeColors.danger,
                            icon: XCircle,
                            text: 'Not Played',
                            bgColor: `${themeColors.danger}20`
                        };
                    case 'interrupted':
                    case 'partially_played':
                        return {
                            color: themeColors.warning,
                            icon: AlertCircle,
                            text: 'Interrupted',
                            bgColor: `${themeColors.warning}20`
                        };
                    default:
                        return {
                            color: themeColors.warning,
                            icon: AlertCircle,
                            text: 'Uncompleted',
                            bgColor: `${themeColors.warning}20`
                        };
                }
            default:
                return {
                    color: themeColors.text,
                    icon: Clock,
                    text: 'Unknown',
                    bgColor: `${themeColors.text}10`
                };
        }
    };

    // Export functionality
    const handleExport = () => {
        // Simple CSV export implementation
        const headers = ['Ad Title', 'TV', 'Play Duration', 'Status', 'Start Time', 'End Time', 'Completion %', 'Remark'];
        const csvData = logs.map(log => [
            log.adTitle,
            log.tvId?.tvName || 'N/A',
            log.playDuration?.formatted || '0 sec',
            getStatusConfig(log).text,
            formatDate(log.startTime),
            formatDate(log.endTime),
            `${log.enhancedCompletion?.percentage || 0}%`,
            log.remark || 'N/A'
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ad-logs-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast.success('Export started successfully');
    };

    if (loading && logs.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '50vh',
                color: themeColors.text
            }}>
                <RefreshCw className="animate-spin" style={{ height: 32, width: 32, marginRight: 12 }} />
                Loading Ad Logs...
            </div>
        );
    }

    return (
        <div style={{
            padding: 24,
            background: themeColors.surface,
            borderRadius: 16,
            boxShadow: `0 2px 16px ${themeColors.primary}10`
        }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
                flexWrap: 'wrap',
                gap: 16
            }}>
                <div>
                    <h1 style={{
                        fontSize: 32,
                        fontWeight: 800,
                        color: themeColors.primary,
                        marginBottom: 8
                    }}>
                        Ad Playback Logs
                    </h1>
                    <p style={{ color: themeColors.text, opacity: 0.8 }}>
                        {stats ? `Total ${stats.totalLogs} logs • ${stats.completedLogs} completed • ${stats.uncompletedLogs} uncompleted` : 'Loading statistics...'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleExport}
                        style={{
                            padding: '8px 16px',
                            background: "green",   // hardcode test
                            color: "white",        // hardcode test
                            border: 'none',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        <Download size={16} />
                        Export CSV
                    </button>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => setViewType('table')}
                            style={{
                                padding: '8px 16px',
                                background: viewType === 'table' ? themeColors.primary : themeColors.background,
                                color: viewType === 'table' ? themeColors.surface : themeColors.text,
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                cursor: 'pointer'
                            }}
                        >
                            Table View
                        </button>
                        <button
                            onClick={() => setViewType('grid')}
                            style={{
                                padding: '8px 16px',
                                background: viewType === 'grid' ? themeColors.primary : themeColors.background,
                                color: viewType === 'grid' ? themeColors.surface : themeColors.text,
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                cursor: 'pointer'
                            }}
                        >
                            Grid View
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 24
                }}>
                    <div style={{
                        background: themeColors.background,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${themeColors.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <BarChart3 size={20} color={themeColors.primary} />
                            <span style={{ fontWeight: 600, color: themeColors.text }}>Total Plays</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.primary }}>
                            {stats.totalLogs}
                        </div>
                    </div>

                    <div style={{
                        background: themeColors.background,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${themeColors.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <CheckCircle size={20} color={themeColors.success} />
                            <span style={{ fontWeight: 600, color: themeColors.text }}>Completed</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.success }}>
                            {stats.completedLogs} ({stats.completionRate}%)
                        </div>
                    </div>

                    <div style={{
                        background: themeColors.background,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${themeColors.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Clock size={20} color={themeColors.warning} />
                            <span style={{ fontWeight: 600, color: themeColors.text }}>Avg Duration</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.warning }}>
                            {stats.averagePlayDuration}s
                        </div>
                    </div>

                    <div style={{
                        background: themeColors.background,
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${themeColors.border}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Tv size={20} color={themeColors.accent} />
                            <span style={{ fontWeight: 600, color: themeColors.text }}>Unique TVs</span>
                        </div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.accent }}>
                            {stats.uniqueTVCount}
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gap: 16 }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative' }}>
                        <Search style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: themeColors.text,
                            opacity: 0.6
                        }} />
                        <input
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            placeholder="Search by ad title, remark, or play time..."
                            style={{
                                paddingLeft: 40,
                                padding: '12px 16px',
                                width: '100%',
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: 8,
                                background: themeColors.background,
                                color: themeColors.text,
                                outline: 'none',
                                fontSize: 14
                            }}
                        />
                    </div>

                    {/* Advanced Filters */}
                    <div style={{
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: themeColors.background
                    }}>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: themeColors.text
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Filter size={16} />
                                <span>Advanced Filters</span>
                            </div>
                            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>

                        {showFilters && (
                            <div style={{
                                padding: 16,
                                borderTop: `1px solid ${themeColors.border}`,
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: 16
                            }}>
                                {/* Completion Status Filter */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: themeColors.primary,
                                        marginBottom: 6
                                    }}>
                                        Completion Status
                                    </label>
                                    <select
                                        value={filters.completionStatus}
                                        onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${themeColors.border}`,
                                            background: themeColors.surface,
                                            color: themeColors.text,
                                            fontSize: 14
                                        }}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="completed">Completed</option>
                                        <option value="uncompleted">Uncompleted</option>
                                        <option value="interrupted">Interrupted</option>
                                        <option value="not_played">Not Played</option>
                                    </select>
                                </div>

                                {/* Date Range Filters */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: themeColors.primary,
                                        marginBottom: 6
                                    }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${themeColors.border}`,
                                            background: themeColors.surface,
                                            color: themeColors.text,
                                            fontSize: 14
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: themeColors.primary,
                                        marginBottom: 6
                                    }}>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${themeColors.border}`,
                                            background: themeColors.surface,
                                            color: themeColors.text,
                                            fontSize: 14
                                        }}
                                    />
                                </div>

                                {/* Sort Options */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: themeColors.primary,
                                        marginBottom: 6
                                    }}>
                                        Sort By
                                    </label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            border: `1px solid ${themeColors.border}`,
                                            background: themeColors.surface,
                                            color: themeColors.text,
                                            fontSize: 14
                                        }}
                                    >
                                        <option value="createdAt">Created Date</option>
                                        <option value="playDuration">Play Duration</option>
                                        <option value="completionPercentage">Completion %</option>
                                        <option value="startTime">Start Time</option>
                                    </select>
                                </div>
                                <select
                                    value={pagination.limit}
                                    onChange={(e) => {
                                        const val = e.target.value;

                                        setPagination((prev) => ({
                                            ...prev,
                                            limit: val === "all" ? "all" : Number(val) || 11, // fallback default 10
                                            currentPage: 1,
                                        }));
                                    }}

                                    style={{
                                        width: "100%",
                                        padding: "8px 12px",
                                        borderRadius: 6,
                                        border: `1px solid ${themeColors.border}`,
                                        background: themeColors.surface,
                                        color: themeColors.text,
                                        fontSize: 14,
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                    <option value="200">200</option>
                                    <option value="250">250</option>
                                    <option value="350">350</option>
                                    <option value="400">400</option>
                                    <option value="500">500</option>
                                    <option value="1000">1000</option>
                                    <option value="5000">5000</option>
                                    <option value="10000">10000</option>
                                    <option value="500000">500000</option>
                                    <option value="1000000">1000000</option>
                                    {/* <option value="all">All</option> */}
                                </select>


                                {/* Reset Filters */}
                                <div style={{ display: 'flex', alignItems: 'end' }}>
                                    <button
                                        onClick={resetFilters}
                                        style={{
                                            padding: '8px 16px',
                                            background: themeColors.danger,
                                            color: themeColors.surface,
                                            border: 'none',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            fontSize: 14
                                        }}
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Logs Display */}
            {viewType === 'table' ? (
                <TableView
                    logs={logs}
                    themeColors={themeColors}
                    getStatusConfig={getStatusConfig}
                    formatDate={formatDate}
                />
            ) : (
                <GridView
                    logs={logs}
                    themeColors={themeColors}
                    getStatusConfig={getStatusConfig}
                    formatDate={formatDate}
                />
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 24,
                    paddingTop: 16,
                    borderTop: `1px solid ${themeColors.border}`
                }}>
                    <div style={{ color: themeColors.text, fontSize: 14 }}>
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            style={{
                                padding: '8px 12px',
                                background: pagination.currentPage === 1 ? themeColors.background : themeColors.primary,
                                color: pagination.currentPage === 1 ? themeColors.text : themeColors.surface,
                                border: 'none',
                                borderRadius: 6,
                                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                                opacity: pagination.currentPage === 1 ? 0.5 : 1
                            }}
                        >
                            Previous
                        </button>

                        <div style={{ display: 'flex', gap: 4 }}>
                            {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                                const pageNum = pagination.currentPage <= 3
                                    ? index + 1
                                    : pagination.currentPage >= pagination.totalPages - 2
                                        ? pagination.totalPages - 4 + index
                                        : pagination.currentPage - 2 + index;

                                if (pageNum < 1 || pageNum > pagination.totalPages) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        style={{
                                            padding: '8px 12px',
                                            background: pagination.currentPage === pageNum ? themeColors.primary : themeColors.background,
                                            color: pagination.currentPage === pageNum ? themeColors.surface : themeColors.text,
                                            border: `1px solid ${themeColors.border}`,
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            minWidth: 40
                                        }}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            style={{
                                padding: '8px 12px',
                                background: pagination.currentPage === pagination.totalPages ? themeColors.background : themeColors.primary,
                                color: pagination.currentPage === pagination.totalPages ? themeColors.text : themeColors.surface,
                                border: 'none',
                                borderRadius: 6,
                                cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                                opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1
                            }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Table View Component
const TableView = ({ logs, themeColors, getStatusConfig, formatDate }) => (
    <div style={{ overflowX: 'auto', background: themeColors.background, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: themeColors.primary, color: themeColors.surface }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Ad</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>TV</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Duration</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Start Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>End Time</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Completion</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600 }}>Remark</th>
                </tr>
            </thead>
            <tbody>
                {logs.map((log, index) => {
                    const statusConfig = getStatusConfig(log);
                    const StatusIcon = statusConfig.icon;

                    return (
                        <tr key={log._id} style={{
                            borderBottom: `1px solid ${themeColors.border}`,
                            background: index % 2 === 0 ? themeColors.surface : themeColors.background
                        }}>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: 600, color: themeColors.text }}>
                                    {log.adTitle}
                                </div>
                                <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                                    {log.adId?.categories?.slice(0, 2).join(', ')}
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: 600, color: themeColors.text }}>
                                    {log.tvId?.tvName || 'N/A'}
                                </div>
                                <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                                    TV {log.tvId?.tvId}
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Clock size={14} />
                                    <span style={{ fontWeight: 600, color: themeColors.text }}>
                                        {log.playDuration?.formatted || '0 sec'}
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                                    Expected: {log.adId?.duration?.toFixed(1)}s
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    background: statusConfig.bgColor,
                                    color: statusConfig.color,
                                    fontSize: 12,
                                    fontWeight: 600
                                }}>
                                    <StatusIcon size={12} />
                                    {statusConfig.text}
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 14 }}>
                                {formatDate(log.startTime)}
                            </td>
                            <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 14 }}>
                                {formatDate(log.endTime)}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: 600, color: themeColors.text }}>
                                    {log.enhancedCompletion?.percentage || 0}%
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: 4,
                                    background: themeColors.background,
                                    borderRadius: 2,
                                    marginTop: 4
                                }}>
                                    <div style={{
                                        width: `${log.enhancedCompletion?.percentage || 0}%`,
                                        height: '100%',
                                        background: themeColors.primary,
                                        borderRadius: 2
                                    }} />
                                </div>
                            </td>
                            <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 14, maxWidth: 200 }}>
                                <div style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {log.remark || 'No remark'}
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

// Grid View Component
const GridView = ({ logs, themeColors, getStatusConfig, formatDate }) => (
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 16
    }}>
        {logs.map((log) => {
            const statusConfig = getStatusConfig(log);
            const StatusIcon = statusConfig.icon;

            return (
                <div key={log._id} style={{
                    background: themeColors.background,
                    border: `1px solid ${themeColors.border}`,
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                            <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 16 }}>
                                {log.adTitle}
                            </div>
                            <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                                {log.adId?.categories?.join(', ')}
                            </div>
                        </div>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: statusConfig.bgColor,
                            color: statusConfig.color,
                            fontSize: 11,
                            fontWeight: 600
                        }}>
                            <StatusIcon size={10} />
                            {statusConfig.text}
                        </div>
                    </div>

                    {/* TV Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tv size={14} color={themeColors.text} opacity={0.7} />
                        <span style={{ fontSize: 14, color: themeColors.text }}>
                            {log.tvId?.tvName} (TV {log.tvId?.tvId})
                        </span>
                    </div>

                    {/* Duration Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} color={themeColors.text} opacity={0.7} />
                        <span style={{ fontSize: 14, color: themeColors.text }}>
                            {log.playDuration?.formatted} / {log.adId?.duration?.toFixed(1)}s
                        </span>
                    </div>

                    {/* Completion Progress */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, color: themeColors.text }}>Completion</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>
                                {log.enhancedCompletion?.percentage || 0}%
                            </span>
                        </div>
                        <div style={{
                            width: '100%',
                            height: 6,
                            background: themeColors.surface,
                            borderRadius: 3
                        }}>
                            <div style={{
                                width: `${log.enhancedCompletion?.percentage || 0}%`,
                                height: '100%',
                                background: themeColors.primary,
                                borderRadius: 3
                            }} />
                        </div>
                    </div>

                    {/* Timestamps */}
                    <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                        <div>Start: {formatDate(log.startTime)}</div>
                        <div>End: {formatDate(log.endTime)}</div>
                    </div>

                    {/* Remark */}
                    {log.remark && (
                        <div style={{
                            padding: 8,
                            background: themeColors.surface,
                            borderRadius: 6,
                            fontSize: 12,
                            color: themeColors.text,
                            borderLeft: `3px solid ${themeColors.primary}`
                        }}>
                            {log.remark}
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);

export default AdLogsViewer;