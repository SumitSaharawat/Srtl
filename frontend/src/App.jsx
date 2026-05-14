import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [files, setFiles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // States for fetching existing images
  const [searchVehicleId, setSearchVehicleId] = useState('');
  const [searchDriverName, setSearchDriverName] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [fetchedImageUrls, setFetchedImageUrls] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !vehicleId || !driverName) {
      setError('Please provide at least one file, a vehicle ID, and a driver name.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadedImageUrls([]);

    try {
      // Create an array of upload promises to run them all concurrently
      const uploadPromises = files.map(async (file) => {
        // 1. Get pre-signed upload URL from backend
        const urlRes = await fetch(
          `http://localhost:3000/get-upload-url?vehicleId=${encodeURIComponent(vehicleId)}&driverName=${encodeURIComponent(driverName)}&fileType=${encodeURIComponent(file.type)}`
        );
        if (!urlRes.ok) throw new Error('Failed to get upload URL from backend');
        
        const { url: uploadUrl, key } = await urlRes.json();

        // 2. Upload file directly to S3 using the pre-signed URL
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
        
        if (!uploadRes.ok) throw new Error('Failed to upload file to S3');

        // 3. Get pre-signed download URL to display the image
        const downloadRes = await fetch(
          `http://localhost:3000/get-download-url?key=${encodeURIComponent(key)}`
        );
        if (!downloadRes.ok) throw new Error('Failed to get download URL from backend');
        
        const { url: downloadUrl } = await downloadRes.json();
        return downloadUrl;
      });

      // Wait for all uploads to finish simultaneously
      const urls = await Promise.all(uploadPromises);

      // 4. Update state to render the uploaded images
      setUploadedImageUrls(urls);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFetchImages = async () => {
    if (!searchVehicleId || !searchDriverName || !searchDate) {
      setFetchError('Please provide a vehicle ID, driver name, and date to search.');
      return;
    }
    
    setFetching(true);
    setFetchError(null);
    setFetchedImageUrls([]);

    try {
      const res = await fetch(
        `http://localhost:3000/list-images?vehicleId=${encodeURIComponent(searchVehicleId)}&driverName=${encodeURIComponent(searchDriverName)}&date=${encodeURIComponent(searchDate)}`
      );
      if (!res.ok) throw new Error('Failed to fetch images from backend');
      
      const data = await res.json();

      console.log(data);

      if (data.urls.length === 0) {
        setFetchError('No images found for this criteria.');
      } else {
        setFetchedImageUrls(data.urls);
      }
    } catch (err) {
      console.error(err);
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="app-container">
      <h2>Vehicle Image Uploader</h2>
      
      <div className="form-group">
        <label className="form-label">Vehicle ID:</label>
        <select 
          value={vehicleId} 
          onChange={(e) => setVehicleId(e.target.value)} 
          className="form-control"
        >
          <option value="" disabled>Select a vehicle...</option>
          <option value="JAG-123">JAG-123 (Jaguar)</option>
          <option value="HON-456">HON-456 (Honda)</option>
          <option value="TOY-789">TOY-789 (Toyota)</option>
          <option value="BMW-012">BMW-012 (BMW)</option>
          <option value="AUD-345">AUD-345 (Audi)</option>
          <option value="MER-678">MER-678 (Mercedes)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Driver Name:</label>
        <input 
          type="text" 
          value={driverName} 
          onChange={(e) => setDriverName(e.target.value)} 
          className="form-control"
          placeholder="e.g. John Doe"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Image Files:</label>
        <input 
          type="file" 
          accept="image/*" 
          multiple
          onChange={handleFileChange} 
          className="form-control"
        />
        {files.length > 0 && (
          <p className="file-count">
            {files.length} file(s) ready for upload
          </p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button 
        onClick={handleUpload} 
        disabled={uploading} 
        className="upload-btn"
      >
        {uploading ? 'Uploading...' : 'Upload Images'}
      </button>

      {uploadedImageUrls.length > 0 && (
        <div className="preview-section">
          <h3 className="preview-title">Uploaded Images:</h3>
          <div className="image-grid">
            {uploadedImageUrls.map((url, idx) => (
              <img 
                key={idx}
                src={url} 
                alt={`Uploaded Vehicle ${idx + 1}`} 
                className="preview-image"
              />
            ))}
          </div>
        </div>
      )}

      <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #ddd' }} />
      
      <h2>Search / View Images</h2>
      
      <div className="form-group">
        <label className="form-label">Vehicle ID:</label>
        <select 
          value={searchVehicleId} 
          onChange={(e) => setSearchVehicleId(e.target.value)} 
          className="form-control"
        >
          <option value="" disabled>Select a vehicle...</option>
          <option value="JAG-123">JAG-123 (Jaguar)</option>
          <option value="HON-456">HON-456 (Honda)</option>
          <option value="TOY-789">TOY-789 (Toyota)</option>
          <option value="BMW-012">BMW-012 (BMW)</option>
          <option value="AUD-345">AUD-345 (Audi)</option>
          <option value="MER-678">MER-678 (Mercedes)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Driver Name:</label>
        <input 
          type="text" 
          value={searchDriverName} 
          onChange={(e) => setSearchDriverName(e.target.value)} 
          className="form-control"
          placeholder="e.g. John Doe"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Date:</label>
        <input 
          type="date" 
          value={searchDate} 
          onChange={(e) => setSearchDate(e.target.value)} 
          className="form-control"
        />
      </div>

      {fetchError && <div className="error-message">{fetchError}</div>}

      <button 
        onClick={handleFetchImages} 
        disabled={fetching} 
        className="upload-btn"
      >
        {fetching ? 'Fetching...' : 'Fetch Images'}
      </button>

      {fetchedImageUrls.length > 0 && (
        <div className="preview-section">
          <h3 className="preview-title">Fetched Images:</h3>
          <div className="image-grid">
            {fetchedImageUrls.map((url, idx) => (
              <img 
                key={idx}
                src={url} 
                alt={`Fetched Vehicle ${idx + 1}`} 
                className="preview-image"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}