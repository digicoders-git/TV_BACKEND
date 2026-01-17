import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Download, Upload, FileText, X,
    CheckCircle, AlertCircle, RefreshCw, Calendar,
    Eye, Clock, Users, Target, Zap, TrendingUp
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import * as XLSX from 'xlsx';
import scheduleAdAPI from '../apis/scheduleAdAPI';

const ManageAdScheduleByExcel = () => {
    const { themeColors } = useTheme();
    const navigate = useNavigate();
    const auth = useSelector((s) => s.auth.user);
    const fileInput = useRef();

    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [matrixData, setMatrixData] = useState({ tvs: [], ads: [], schedule: {} });
    const [errors, setErrors] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');

    // Sample Data with better naming
    const sampleData = {
        ads: ['adID1', 'adID2', 'adID3'],
        tvs: ['tvID1', 'tvID2', 'tvID3'],
        schedule: {
            'tvID1': {
                'adID1': ['8:00', '12:30'],
                'adID2': ['18:00', '20:15'],
                'adID3': []
            },
            'tvID2': {
                'adID1': ['9:15'],
                'adID2': ['19:30'],
                'adID3': ['21:45']
            },
            'tvID3': {
                'adID1': [],
                'adID2': ['17:00'],
                'adID3': ['14:20', '16:45']
            },
        }
    };

    // Download Sample
    const downloadSample = () => {
        const ws = XLSX.utils.aoa_to_sheet([
            ['TV ID / Ad ID', ...sampleData.ads],
            ...sampleData.tvs.map(tv => [
                tv,
                ...sampleData.ads.map(ad => sampleData.schedule[tv][ad].join('; '))
            ])
        ]);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Schedule Template');
        XLSX.writeFile(wb, 'ad_schedule_template.xlsx');
    };

    // File Upload with improved time validation
    const handleFile = (f) => {
        if (!f || !f.name.match(/\.(xlsx|xls)$/i)) {
            toast.error('Please upload only Excel files (.xlsx or .xls)');
            return;
        }

        setFile(f);
        setFileName(f.name);
        setActiveTab('preview');

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array' });
                const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

                if (data.length < 2) {
                    toast.error('Invalid file format: Not enough data');
                    return;
                }

                const ads = data[0].slice(1).filter(ad => ad);

                if (ads.length === 0) {
                    toast.error('No ad IDs found in the first row');
                    return;
                }

                const tvs = [];
                const schedule = {};
                // Improved time regex - accepts any HH:MM format (0:00 to 23:59)
                const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                const errs = [];

                // Start from row 1 (skip header row)
                data.slice(1).forEach((row, i) => {
                    const tvId = row[0];
                    if (!tvId) return; // Skip empty rows

                    tvs.push(tvId);
                    schedule[tvId] = {};

                    row.slice(1).forEach((cell, j) => {
                        if (j >= ads.length) return; // Skip extra columns

                        const times = (cell || '').toString()
                            .split(/[;,]/) // Accept both semicolon and comma as separators
                            .map(t => t.trim())
                            .filter(Boolean);

                        const invalid = times.filter(t => !timeRegex.test(t));

                        if (invalid.length > 0) {
                            errs.push({
                                row: i + 2,
                                col: j + 2,
                                error: `Invalid time format: ${invalid.join(', ')} (use HH:MM format)`,
                                tvId,
                                adId: ads[j]
                            });
                        }

                        schedule[tvId][ads[j]] = times.filter(t => timeRegex.test(t)); // Only keep valid times
                    });
                });

                if (tvs.length === 0) {
                    toast.error('No TV IDs found in the first column');
                    return;
                }

                setMatrixData({ tvs, ads, schedule });
                setErrors(errs);

                if (errs.length > 0) {
                    toast.error(`Found ${errs.length} error(s) in the spreadsheet`);
                } else {
                    toast.success('File parsed successfully');
                }
            } catch (err) {
                console.error('Parse error:', err);
                toast.error('Failed to parse file: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.length) handleFile(e.dataTransfer.files[0]);
    };

    // Import function with API call
    const handleImport = async () => {
        if (!dateRange.startDate || !dateRange.endDate) {
            return toast.error('Please select a date range');
        }

        if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
            return toast.error('End date must be after start date');
        }

        setIsUploading(true);

        try {
            // Transform data to match API format
            const scheduleData = {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate,
                schedules: []
            };

            // Convert matrix data to API format
            Object.keys(matrixData.schedule).forEach(tvId => {
                const tvSchedule = matrixData.schedule[tvId];

                Object.keys(tvSchedule).forEach(adId => {
                    const playTimes = tvSchedule[adId];

                    if (playTimes && playTimes.length > 0) {
                        scheduleData.schedules.push({
                            ad: adId,
                            tv: tvId,
                            playTimes: playTimes
                        });
                    }
                });
            });
            console.log(scheduleData)
            // Make API call
            const response = await scheduleAdAPI.createAdScheduleByExcel(
                scheduleData,
                auth.token
            );

            setResult({
                success: matrixData.tvs.length,
                total: matrixData.tvs.length,
                dateRange
            });
            setActiveTab('result');
            toast.success('Schedule imported successfully');
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import schedule: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsUploading(false);
        }
    };

    // UI Helper - Enhanced Table
    const renderTable = (data) => (
        <div style={{
            overflow: 'auto',
            maxHeight: '500px',
            background: themeColors.surface,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                    <tr style={{ background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}15)` }}>
                        <th style={{
                            ...thStyle,
                            position: 'sticky',
                            top: 0,
                            background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}15)`,
                            zIndex: 10,
                            fontWeight: 'bold',
                            fontSize: '15px',
                            color: themeColors.primary,
                            minWidth: '120px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Target size={16} />
                                TV IDs ⇓ / Ad IDs ⇒
                            </div>
                        </th>
                        {data.ads.map((ad, i) => (
                            <th key={i} style={{
                                ...thStyle,
                                position: 'sticky',
                                top: 0,
                                background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}15)`,
                                zIndex: 10,
                                minWidth: '140px',
                                textAlign: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start', gap: '6px' }}>
                                    <Zap size={14} style={{ color: themeColors.secondary }} />
                                    {ad}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.tvs.map((tv, i) => (
                        <tr key={i} style={{
                            background: i % 2 ? `${themeColors.surface}` : `${themeColors.background}`,
                            transition: 'all 0.2s ease',
                            ':hover': { background: `${themeColors.primary}08` }
                        }}>
                            <td style={{
                                ...tdStyle,
                                fontWeight: 'bold',
                                position: 'sticky',
                                left: 0,
                                background: 'inherit',
                                color: themeColors.primary,
                                borderRight: `2px solid ${themeColors.border}`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Users size={16} style={{ color: themeColors.secondary }} />
                                    {tv}
                                </div>
                            </td>
                            {data.ads.map((ad, j) => {
                                const times = data.schedule[tv]?.[ad] || [];
                                const hasError = errors.some(e => e.tvId === tv && e.adId === ad);

                                return (
                                    <td
                                        key={j}
                                        style={{
                                            ...tdStyle,
                                            color: hasError ? themeColors.error : times.length > 0 ? themeColors.text : themeColors.textSecondary,
                                            background: hasError ? `${themeColors.error}15` : times.length > 0 ? `${themeColors.success}08` : 'inherit',
                                            textAlign: 'center',
                                            fontWeight: times.length > 0 ? '500' : '400',
                                            border: hasError ? `1px solid ${themeColors.error}40` : 'none'
                                        }}
                                        title={hasError ? errors.find(e => e.tvId === tv && e.adId === ad)?.error : times.length > 0 ? `${times.length} schedule(s)` : 'No schedule'}
                                    >
                                        {times.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'row', gap: '4px', alignItems: 'center' }}>
                                                {times.map((time, idx) => (
                                                    <span key={idx} style={{
                                                        background: `${themeColors.primary}15`,
                                                        padding: '1px 8px',
                                                        borderRadius: '5px',
                                                        fontSize: '13px',
                                                        fontWeight: '500',
                                                        color: themeColors.primary,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}>
                                                        <Clock size={12} />
                                                        {time};
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span style={{ color: themeColors.textSecondary, fontSize: '13px' }}>-</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const thStyle = {
        padding: '16px 12px',
        borderBottom: `2px solid ${themeColors.border}`,
        color: themeColors.primary,
        textAlign: 'left',
        fontWeight: 600,
        fontSize: '14px'
    };

    const tdStyle = {
        padding: '12px',
        borderBottom: `1px solid ${themeColors.border}`,
        fontSize: '14px',
        whiteSpace: 'nowrap'
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const StatsCard = ({ icon: Icon, title, value, color }) => (
        <div style={{
            background: `linear-gradient(135deg, ${color}15, ${color}25)`,
            borderRadius: '12px',
            padding: '20px',
            border: `1px solid ${color}30`,
            flex: 1,
            minWidth: '200px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                    background: `${color}20`,
                    padding: '8px',
                    borderRadius: '8px'
                }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <span style={{ color: themeColors.textSecondary, fontSize: '14px', fontWeight: '500' }}>
                    {title}
                </span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color }}>
                {value}
            </div>
        </div>
    );

    return (
        <div style={{
            padding: '24px',
            background: themeColors.surface,
            borderRadius: '20px',
            //   maxWidth: , 
            margin: '0 auto',
            //   boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
            {/* Enhanced Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '32px',
                padding: '20px',
                background: `linear-gradient(135deg, ${themeColors.primary}08, ${themeColors.secondary}08)`,
                borderRadius: '16px',
                border: `1px solid ${themeColors.border}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button
                        onClick={() => navigate('/dashboard/manage-ad-schedules')}
                        style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: `1px solid ${themeColors.border}`,
                            background: themeColors.background,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                        <ArrowLeft size={20} style={{ color: themeColors.text }} />
                    </button>
                    <div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: themeColors.primary,
                            margin: '0 0 4px 0',
                            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            Schedule by Excel
                        </h1>
                        <p style={{
                            color: themeColors.textSecondary,
                            margin: 0,
                            fontSize: '16px'
                        }}>
                            Import and manage ad schedules efficiently
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={24} style={{ color: themeColors.primary }} />
                </div>
            </div>

            {/* Enhanced Tabs */}
            <div style={{
                display: 'flex',
                borderBottom: `1px solid ${themeColors.border}`,
                marginBottom: '32px',
                background: themeColors.background,
                borderRadius: '12px 12px 0 0',
                overflow: 'hidden'
            }}>
                {[
                    { key: 'upload', label: 'Upload File', icon: Upload, condition: true },
                    { key: 'preview', label: 'Preview', icon: Eye, condition: file },
                    { key: 'result', label: 'Result', icon: CheckCircle, condition: result }
                ].map(({ key, label, icon: Icon, condition }) => condition && (
                    <button
                        key={key}
                        style={{
                            padding: '16px 24px',
                            background: activeTab === key ? themeColors.primary : 'transparent',
                            color: activeTab === key ? themeColors.surface : themeColors.text,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            borderRadius: activeTab === key ? '8px 8px 0 0' : '0'
                        }}
                        onClick={() => setActiveTab(key)}
                        onMouseEnter={(e) => {
                            if (activeTab !== key) {
                                e.target.style.background = `${themeColors.primary}10`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== key) {
                                e.target.style.background = 'transparent';
                            }
                        }}
                    >
                        <Icon size={18} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Template Section */}
                    <div style={{ marginBottom: '40px' }}>
                        <div
                            style={{
                                background: `linear-gradient(135deg, ${themeColors.primary}08, ${themeColors.accent}08)`,
                                borderRadius: "16px",
                                padding: "24px",
                                marginBottom: "24px",
                                border: `1px solid ${themeColors.primary}20`,
                            }}
                        >
                            <h3
                                style={{
                                    color: themeColors.primary,
                                    marginBottom: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    fontSize: "20px",
                                    fontWeight: "bold",
                                }}
                            >
                                <FileText size={24} /> Excel Template
                            </h3>

                            <p
                                style={{
                                    color: themeColors.text,
                                    marginBottom: "20px",
                                    fontSize: "16px",
                                    lineHeight: "1.6",
                                }}
                            >
                                Download our template to ensure your Excel file has the correct format. The
                                first row should contain ad IDs (AD1, AD2, AD3...), and the first column
                                should contain TV IDs (TV1, TV2, TV3...).
                            </p>

                            <button
                                onClick={downloadSample}
                                className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-[15px] shadow-md transition-transform duration-200 hover:-translate-y-1"
                                style={{
                                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                    color: themeColors.surface,
                                }}
                            >
                                <Download size={18} /> Download Template
                            </button>
                        </div>


                        {/* Sample Preview */}
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{
                                color: themeColors.primary,
                                marginBottom: '16px',
                                fontSize: '18px',
                                fontWeight: '600'
                            }}>
                                Template Preview
                            </h4>
                            {renderTable(sampleData)}
                        </div>
                    </div>

                    {/* Enhanced Upload Area */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        style={{
                            border: `3px dashed ${dragActive ? themeColors.primary : themeColors.border}`,
                            borderRadius: '20px',
                            padding: '60px 40px',
                            textAlign: 'center',
                            background: dragActive ?
                                `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}15)` :
                                `linear-gradient(135deg, ${themeColors.background}, ${themeColors.surface})`,
                            transition: 'all 0.3s ease',
                            transform: dragActive ? 'scale(1.02)' : 'scale(1)',
                            boxShadow: dragActive ? '0 10px 25px rgba(0, 0, 0, 0.1)' : '0 4px 6px rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        <div style={{
                            background: `${themeColors.primary}15`,
                            padding: '20px',
                            borderRadius: '50%',
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Upload size={40} style={{ color: themeColors.primary }} />
                        </div>
                        <h3 style={{
                            color: themeColors.text,
                            marginBottom: '8px',
                            fontWeight: 'bold',
                            fontSize: '20px'
                        }}>
                            Drag & drop your Excel file here
                        </h3>
                        <p style={{
                            color: themeColors.textSecondary,
                            fontSize: '16px',
                            marginBottom: '24px',
                            lineHeight: '1.5'
                        }}>
                            Supports .xlsx and .xls files with time format HH:MM (e.g., 8:00 14:30 20:15)
                        </p>
                        <input
                            type="file"
                            ref={fileInput}
                            onChange={(e) => handleFile(e.target.files[0])}
                            accept=".xlsx,.xls"
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInput.current?.click()}
                            className="px-8 py-4 rounded-xl font-semibold text-[16px] shadow-md transition-transform duration-200 hover:-translate-y-1"
                            style={{
                                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                color: themeColors.surface,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Browse Files
                        </button>

                    </div>
                </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && file && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* File Info & Stats */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '32px',
                        flexWrap: 'wrap',
                        gap: '20px'
                    }}>
                        <div style={{
                            background: `linear-gradient(135deg, ${themeColors.primary}08, ${themeColors.secondary}08)`,
                            borderRadius: '16px',
                            padding: '24px',
                            flex: 1,
                            minWidth: '300px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{
                                        color: themeColors.primary,
                                        margin: '0 0 8px 0',
                                        fontSize: '20px',
                                        fontWeight: 'bold'
                                    }}>
                                        📊 {fileName}
                                    </h3>
                                    <p style={{
                                        color: themeColors.textSecondary,
                                        margin: 0,
                                        fontSize: '15px'
                                    }}>
                                        Ready for import
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setFile(null);
                                        setFileName('');
                                        setMatrixData({ tvs: [], ads: [], schedule: {} });
                                        setErrors([]);
                                        setActiveTab('upload');
                                    }}
                                    style={{
                                        border: 'none',
                                        background: `${themeColors.error}15`,
                                        cursor: 'pointer',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = `${themeColors.error}25`}
                                    onMouseLeave={(e) => e.target.style.background = `${themeColors.error}15`}
                                >
                                    <X size={18} style={{ color: themeColors.error }} />
                                </button>
                            </div>

                            {/* Stats Cards */}
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <StatsCard
                                    icon={Users}
                                    title="TV Count"
                                    value={matrixData.tvs.length}
                                    color={themeColors.primary}
                                />
                                <StatsCard
                                    icon={Target}
                                    title="Ad Count"
                                    value={matrixData.ads.length}
                                    color={themeColors.secondary}
                                />
                                <StatsCard
                                    icon={AlertCircle}
                                    title="Errors"
                                    value={errors.length}
                                    color={errors.length > 0 ? themeColors.error : themeColors.success}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div style={{
                        marginBottom: '32px',
                        background: themeColors.background,
                        borderRadius: '16px',
                        padding: '24px',
                        border: `1px solid ${themeColors.border}`
                    }}>
                        <h4 style={{
                            color: themeColors.primary,
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '18px',
                            fontWeight: 'bold'
                        }}>
                            <Calendar size={20} /> Select Date Range
                        </h4>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: themeColors.text,
                                    fontSize: '15px',
                                    fontWeight: '500'
                                }}>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `1px solid ${themeColors.border}`,
                                        borderRadius: '10px',
                                        background: themeColors.surface,
                                        color: themeColors.text,
                                        fontSize: '15px',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>
                            <div style={{ flex: '1', minWidth: '250px' }}>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '8px',
                                    color: themeColors.text,
                                    fontSize: '15px',
                                    fontWeight: '500'
                                }}>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: `1px solid ${themeColors.border}`,
                                        borderRadius: '10px',
                                        background: themeColors.surface,
                                        color: themeColors.text,
                                        fontSize: '15px',
                                        transition: 'all 0.2s ease'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error List */}
                    {errors.length > 0 && (
                        <div style={{
                            marginBottom: '32px',
                            padding: '24px',
                            background: `${themeColors.error}08`,
                            borderRadius: '16px',
                            border: `1px solid ${themeColors.error}30`
                        }}>
                            <h4 style={{
                                color: themeColors.error,
                                margin: '0 0 20px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                fontSize: '18px',
                                fontWeight: 'bold'
                            }}>
                                <AlertCircle size={20} /> Validation Errors ({errors.length})
                            </h4>
                            <div style={{
                                maxHeight: '300px',
                                overflow: 'auto',
                                background: themeColors.surface,
                                borderRadius: '12px',
                                border: `1px solid ${themeColors.border}`
                            }}>
                                {errors.map((error, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            padding: '16px',
                                            borderBottom: index < errors.length - 1 ? `1px solid ${themeColors.border}` : 'none',
                                            fontSize: '15px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            background: `${themeColors.error}15`,
                                            padding: '6px',
                                            borderRadius: '6px'
                                        }}>
                                            <AlertCircle size={16} style={{ color: themeColors.error }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{
                                                color: themeColors.error,
                                                fontWeight: '600',
                                                fontSize: '14px'
                                            }}>
                                                Row {error.row}, Column {error.col} ({error.tvId} - {error.adId}):
                                            </span>
                                            <br />
                                            <span style={{ color: themeColors.text, fontSize: '14px' }}>
                                                {error.error}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Data Preview */}
                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{
                            color: themeColors.primary,
                            marginBottom: '20px',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <Eye size={20} /> Data Preview
                        </h4>
                        {renderTable(matrixData)}
                    </div>

                    {/* Action Buttons */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "32px",
                            padding: "24px",
                            background: themeColors.background,
                            borderRadius: "16px",
                            border: `1px solid ${themeColors.border}`,
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    color: themeColors.textSecondary,
                                    margin: 0,
                                    fontSize: "14px",
                                }}
                            >
                                {errors.length > 0
                                    ? `⚠️ Please fix ${errors.length} error(s) before importing`
                                    : `✅ Ready to schedule ${matrixData.tvs.length} TVs with ${matrixData.ads.length} ads`}
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "16px" }}>
                            {/* Back Button */}
                            <button
                                onClick={() => setActiveTab("upload")}
                                className="px-8 py-3 rounded-xl font-semibold text-[15px] shadow-md transition-transform duration-200 hover:-translate-y-1"
                                style={{
                                    background: `linear-gradient(135deg, ${themeColors.background}, ${themeColors.surface})`,
                                    color: themeColors.text,
                                    border: "1px solid " + themeColors.border,
                                    cursor: "pointer",
                                }}
                            >
                                Back
                            </button>

                            {/* Schedule Button */}
                            <button
                                onClick={handleImport}
                                disabled={
                                    errors.length > 0 ||
                                    isUploading ||
                                    !dateRange.startDate ||
                                    !dateRange.endDate
                                }
                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-[15px] shadow-md transition-transform duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                                style={{
                                    background:
                                        errors.length > 0 ||
                                            isUploading ||
                                            !dateRange.startDate ||
                                            !dateRange.endDate
                                            ? `linear-gradient(135deg, ${themeColors.border}, ${themeColors.background})` // Disabled gradient
                                            : `linear-gradient(135deg, ${themeColors.success}, ${themeColors.primary})`, // Active gradient
                                    color:
                                        errors.length > 0 ||
                                            isUploading ||
                                            !dateRange.startDate ||
                                            !dateRange.endDate
                                            ? themeColors.textSecondary // Disabled text color
                                            : themeColors.surfaceLight, // Active text color
                                    border: "1px solid " + themeColors.border,
                                    cursor:
                                        errors.length > 0 ||
                                            isUploading ||
                                            !dateRange.startDate ||
                                            !dateRange.endDate
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                                onMouseEnter={(e) => {
                                    if (
                                        errors.length === 0 &&
                                        !isUploading &&
                                        dateRange.startDate &&
                                        dateRange.endDate
                                    ) {
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (
                                        errors.length === 0 &&
                                        !isUploading &&
                                        dateRange.startDate &&
                                        dateRange.endDate
                                    ) {
                                        e.currentTarget.style.transform = "translateY(0)";
                                    }
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        Schedule {matrixData.tvs.length} TVs
                                    </>
                                )}
                            </button>

                        </div>
                    </div>

                </div>
            )}

            {/* Result Tab */}
            {activeTab === 'result' && result && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 40px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{
                        background: `linear-gradient(135deg, ${themeColors.success}15, ${themeColors.primary}15)`,
                        borderRadius: '24px',
                        padding: '40px',
                        maxWidth: '600px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            background: `${themeColors.success}20`,
                            padding: '24px',
                            borderRadius: '50%',
                            width: '100px',
                            height: '100px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircle size={48} style={{ color: themeColors.success }} />
                        </div>

                        <h3 style={{
                            color: themeColors.primary,
                            margin: '0 0 16px 0',
                            fontSize: '28px',
                            fontWeight: 'bold'
                        }}>
                            🎉 Ad Scheduled Successfully!
                        </h3>

                        <div style={{
                            background: themeColors.surface,
                            borderRadius: '16px',
                            padding: '24px',
                            margin: '24px 0',
                            border: `1px solid ${themeColors.border}`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                                <div>
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: themeColors.success,
                                        marginBottom: '8px'
                                    }}>
                                        {result.success}
                                    </div>
                                    <div style={{ color: themeColors.textSecondary, fontSize: '14px' }}>
                                        TVs Scheduled
                                    </div>
                                </div>
                                <div style={{
                                    width: '1px',
                                    background: themeColors.border,
                                    margin: '0 20px'
                                }}></div>
                                <div>
                                    <div style={{
                                        fontSize: '32px',
                                        fontWeight: 'bold',
                                        color: themeColors.primary,
                                        marginBottom: '8px'
                                    }}>
                                        {result.total}
                                    </div>
                                    <div style={{ color: themeColors.textSecondary, fontSize: '14px' }}>
                                        Total TVs
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p style={{
                            color: themeColors.textSecondary,
                            margin: '0 0 32px 0',
                            fontSize: '16px',
                            lineHeight: '1.5'
                        }}>
                            Schedule active from <strong>{formatDate(result.dateRange.startDate)}</strong> to <strong>{formatDate(result.dateRange.endDate)}</strong>
                        </p>
                        <div
                            style={{
                                display: "flex",
                                gap: "16px",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {/* View Schedules */}
                            <button
                                onClick={() => navigate("/dashboard/manage-ad-schedules")}
                                style={{
                                    padding: "14px 28px",
                                    background: themeColors.background,
                                    border: `1px solid ${themeColors.border}`,
                                    borderRadius: "12px",
                                    color: themeColors.text,
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "15px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = themeColors.surface;
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = themeColors.background;
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                <Eye size={16} />
                                View Schedules
                            </button>

                            {/* Import Another */}
                            <button
                                onClick={() => {
                                    setResult(null);
                                    setFile(null);
                                    setFileName("");
                                    setMatrixData({ tvs: [], ads: [], schedule: {} });
                                    setErrors([]);
                                    setDateRange({ startDate: "", endDate: "" });
                                    setActiveTab("upload");
                                }}
                                style={{
                                    padding: "14px 28px",
                                    background: themeColors.background,
                                    border: `1px solid ${themeColors.border}`,
                                    borderRadius: "12px",
                                    color: themeColors.text,
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    fontSize: "15px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = themeColors.surface;
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = themeColors.background;
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}

                            >
                                <Upload size={18} />
                                Import Another
                            </button>
                        </div>

                    </div>
                </div>
            )}

            <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        input[type="date"]::-webkit-calendar-picker-indicator {
          color: ${themeColors.primary};
        }
        
        table tbody tr:hover {
          background: ${themeColors.primary}08 !important;
          transform: scale(1.001);
          transition: all 0.2s ease;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed !important;
        }
        
        .upload-area:hover {
          transform: translateY(-2px);
        }
      `}</style>
        </div>
    );
};

export default ManageAdScheduleByExcel;