import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardRecords } from './services/api';
import './Dashboard.css';

const S3_BASE_URL = 'https://srtl-company-assets.s3.ca-west-1.amazonaws.com';

function Dashboard() {
  // LEFT PANEL STATE
  const [leftRecords, setLeftRecords] = useState([]);
  const [leftFilters, setLeftFilters] = useState({ vanNumber: '', name: '', date: '', inspectionType: '' });
  const [leftLoading, setLeftLoading] = useState(false);
  const [leftMaximizedImg, setLeftMaximizedImg] = useState(null);

  // RIGHT PANEL STATE
  const [rightRecords, setRightRecords] = useState([]);
  const [rightFilters, setRightFilters] = useState({ vanNumber: '', name: '', date: '', inspectionType: '' });
  const [rightLoading, setRightLoading] = useState(false);
  const [rightMaximizedImg, setRightMaximizedImg] = useState(null);

  const handleFilterChange = (panel, e) => {
    const { name, value } = e.target;
    if (panel === 'left') {
      setLeftFilters(prev => ({ ...prev, [name]: value }));
    } else {
      setRightFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Helper check to determine if the manager has modified at least one form value
  const hasActiveFilters = (filters) => {
    return Object.values(filters).some(value => value !== '');
  };

  const fetchLeftInspections = useCallback(async () => {
    // GUARD: If no search parameters are typed or selected, clear state and abort query execution
    if (!hasActiveFilters(leftFilters)) {
      setLeftRecords([]);
      return;
    }

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
    // GUARD: If no search parameters are typed or selected, clear state and abort query execution
    if (!hasActiveFilters(rightFilters)) {
      setRightRecords([]);
      return;
    }

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

  const handleImageOpen = (e, side, imgUrl) => {
    e.preventDefault();
    if (side === 'left') {
      setLeftMaximizedImg(imgUrl);
    } else {
      setRightMaximizedImg(imgUrl);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminToken');
    window.location.href = '/login'; // Instantly route them out of active memory grids
};

  const renderDashboardPanel = (side, filters, records, loading, maximizedImg, setMaximizedImg) => {
    const isSearching = hasActiveFilters(filters);

    return (
      <div className={`dashboard-panel ${side}-panel`}>
        <div className="panel-header-badge">
          <h3>{side === 'left' ? 'LEFT WORKSPACE 1' : 'RIGHT WORKSPACE 2'}</h3>
        </div>

        {maximizedImg ? (
          <div className="panel-inline-lightbox">
            <div className="inline-lightbox-controls">
              <span>🔎 High-Res Inspection Preview</span>
              <button className="close-inline-btn" onClick={() => setMaximizedImg(null)}>Back to Logs ✕</button>
            </div>
            <div className="inline-lightbox-body">
              <img src={maximizedImg} alt="Panel maximized asset view" />
            </div>
          </div>
        ) : (
          <>
            {/* --- FILTERS CONSOLE --- */}
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

            {/* --- LOG RECORDS SCROLL FEED --- */}
            <div className="panel-feed">
              {!isSearching ? (
                <div className="panel-idle-state">
                  <p>⚡ Workspace Waiting</p>
                  <span>Select a van identifier, select a date, or type a driver name above to populate logs.</span>
                </div>
              ) : records.length === 0 ? (
                <p className="no-records-mini">No matching logs found for this filter combination.</p>
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
                            onClick={(e) => handleImageOpen(e, side, fullUrl)}
                          >
                            <img src={fullUrl} alt="Van Grid Thumbnail" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="split-dashboard-wrapper">
      <div className="global-dashboard-header">
        <h2>Fleet Inspection</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
      
      <div className="dual-viewport-container">
        {renderDashboardPanel('left', leftFilters, leftRecords, leftLoading, leftMaximizedImg, setLeftMaximizedImg)}
        {renderDashboardPanel('right', rightFilters, rightRecords, rightLoading, rightMaximizedImg, setRightMaximizedImg)}
      </div>
    </div>
  );
}

export default Dashboard;