import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardRecords } from './services/api';
import './Dashboard.css';

const S3_BASE_URL = 'https://srtl-company-assets.s3.ca-west-1.amazonaws.com';

function Dashboard() {
  // Left Panel States
  const [leftRecords, setLeftRecords] = useState([]);
  const [leftFilters, setLeftFilters] = useState({ vanNumber: '', name: '', date: '', inspectionType: '' });
  const [leftLoading, setLeftLoading] = useState(false);

  // Right Panel States
  const [rightRecords, setRightRecords] = useState([]);
  const [rightFilters, setRightFilters] = useState({ vanNumber: '', name: '', date: '', inspectionType: '' });
  const [rightLoading, setRightLoading] = useState(false);

  // Inline Modal State for full-window image viewing
  const [activeModalImage, setActiveModalImage] = useState(null);

  const handleFilterChange = (panel, e) => {
    const { name, value } = e.target;
    if (panel === 'left') {
      setLeftFilters(prev => ({ ...prev, [name]: value }));
    } else {
      setRightFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const fetchLeftInspections = useCallback(async () => {
    setLeftLoading(true);
    try {
      const data = await getDashboardRecords(leftFilters);
      setLeftRecords(data.records);
    } catch (error) {
      console.error('Error fetching left records:', error);
    } finally {
      setLeftLoading(false);
    }
  }, [leftFilters]);

  const fetchRightInspections = useCallback(async () => {
    setRightLoading(true);
    try {
      const data = await getDashboardRecords(rightFilters);
      setRightRecords(data.records);
    } catch (error) {
      console.error('Error fetching right records:', error);
    } finally {
      setRightLoading(false);
    }
  }, [rightFilters]);

  useEffect(() => { fetchLeftInspections(); }, [fetchLeftInspections]);
  useEffect(() => { fetchRightInspections(); }, [fetchRightInspections]);

  // Intercept the anchor click to display the photo inside our custom modal hook
  const handleImageOpen = (e, imgUrl) => {
    e.preventDefault(); 
    setActiveModalImage(imgUrl);
  };

  const renderDashboardPanel = (side, filters, records, loading) => {
    return (
      <div className={`dashboard-panel ${side}-panel`}>
        <div className="panel-header-badge">
          <h3>{side === 'left' ? 'LEFT WORKSPACE 1' : 'RIGHT WORKSPACE 2'}</h3>
        </div>

        <div className="filter-bar-mini">
          <div className="filter-field-row">
            <div>
              <label>Driver Name</label>
              <input type="text" name="name" placeholder="Search driver..." value={filters.name} onChange={(e) => handleFilterChange(side, e)} />
            </div>
            <div>
              <label>Filter by Van</label>
              <select name="vanNumber" value={filters.vanNumber} onChange={(e) => handleFilterChange(side, e)}>
                <option value="">All Vans</option>
                <option value="Van-01">Van 01</option>
                <option value="Van-02">Van 02</option>
                <option value="Van-03">Van 03</option>
              </select>
            </div>
          </div>
          <div className="filter-field-row">
            <div>
              <label>Shift Period</label>
              <select name="inspectionType" value={filters.inspectionType} onChange={(e) => handleFilterChange(side, e)}>
                <option value="">All Shifts</option>
                <option value="before">Before Shift</option>
                <option value="after">After Shift</option>
              </select>
            </div>
            <div>
              <label>Calendar Date</label>
              <input type="date" name="date" value={filters.date} onChange={(e) => handleFilterChange(side, e)} />
            </div>
          </div>
        </div>

        {loading && <div className="mini-loader">Querying cloud log arrays...</div>}

        <div className="panel-feed">
          {records.length === 0 ? (
            <p className="no-records-mini">No matching logs found.</p>
          ) : (
            records.map((log) => (
              <div key={log._id} className="mini-record-card">
                <div className="mini-meta">
                  <h4>{log.vanNumber} - <span className="type-badge-mini">{log.inspectionType}</span></h4>
                  <p><strong>Driver:</strong> {log.firstName} {log.lastName}</p>
                  <p className="timestamp">📅 {new Date(log.inspectionDate).toLocaleDateString()} {new Date(log.inspectionDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <div className="mini-gallery">
                  {log.s3Key.map((key, idx) => {
                    const fullUrl = `${S3_BASE_URL}/${key}`;
                    return (
                      <a 
                        key={idx} 
                        href={fullUrl} 
                        className="mini-lightbox-trigger"
                        onClick={(e) => handleImageOpen(e, fullUrl)}
                      >
                        <img src={fullUrl} alt="Van Grid Reference Asset" />
                      </a>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="split-dashboard-wrapper">
      <div className="global-dashboard-header">
        <h2>Fleet Inspection Split-Screen Control Room</h2>
        <p>Set custom filter parameters on either window panel to run comparative structural analysis.</p>
      </div>
      
      <div className="dual-viewport-container">
        {renderDashboardPanel('left', leftFilters, leftRecords, leftLoading)}
        {renderDashboardPanel('right', rightFilters, rightRecords, rightLoading)}
      </div>

      {/* --- INLINE FULL-SCREEN LIGHTBOX OVERLAY --- */}
      {activeModalImage && (
        <div className="inline-lightbox-overlay" onClick={() => setActiveModalImage(null)}>
          <div className="lightbox-content-wrapper">
            <button className="lightbox-close-corner">✕</button>
            <img src={activeModalImage} alt="Expanded high-resolution asset zoom context" />
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;