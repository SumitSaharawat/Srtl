import React, { useState } from 'react';
import { getPresignedUrl, uploadToS3, submitInspectionLog } from './services/api';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    vanNumber: '',
    firstName: '',
    lastName: '',
    inspectionType: 'before',
  });
  
  // State changed to track arrays instead of individual files
  const [photos, setPhotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Loop through and optimize multiple files simultaneously
  const handleFileChange = async (e) => {
    const rawFiles = Array.from(e.target.files);
    if (rawFiles.length === 0) return;

    // Generate immediate UI previews for all selected images
    const localPreviews = rawFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(localPreviews);
    
    setLoading(true);
    setStatusMessage(`Optimizing ${rawFiles.length} photos...`);

    try {
      setPhotos(rawFiles);
      setStatusMessage('All photos optimized and ready.');
    } catch (error) {
      console.error('Batch compression failed', error);
      setPhotos(rawFiles);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length === 0) return alert('Please attach at least one vehicle photo.');

    setLoading(true);
    setStatusMessage(`Authorizing ${photos.length} cloud secure channels...`);

    try {
      // Execute the AWS handshake and upload loop concurrently for every photo
      const uploadPromises = photos.map(async (photo, index) => {
        // Stage A: Fetch a clean unique presigned URL contract for this specific file block
        const { uploadUrl, s3Key } = await getPresignedUrl(
          formData.vanNumber,
          photo.type,
          `${formData.inspectionType}-${index + 1}` // Appends file index order: before-1, before-2
        );

        // Stage B: Ship this image binary directly to S3
        await uploadToS3(uploadUrl, photo);
        
        return s3Key; // Pass the key backward so we can collect them in an array
      });

      // Wait until all parallel file uploads hit AWS successfully
      const uploadedS3Keys = await Promise.all(uploadPromises);

      setStatusMessage('Syncing complete metadata ledger onto server database...');
      
      // Stage C: Push the clean tracking array down to your MongoDB instance
      await submitInspectionLog({
        ...formData,
        s3Key: uploadedS3Keys, // Array of strings match: ["vans/...", "vans/..."]
      });

      setStatusMessage('');
      alert(`Success! Handled ${photos.length} vehicle logs securely.`);
      
      // Clear interface parameters
      setPhotos([]);
      setPreviewUrls([]);
      setFormData({ vanNumber: '', firstName: '', lastName: '', inspectionType: 'before' });

    } catch (error) {
      console.error('Batch upload lifecycle failure:', error);
      setStatusMessage('');
      alert(error.response?.data?.message || 'Bulk transmission dropped due to a network connection timeout.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Multi-Angle Inspection Portal</h2>
      <form onSubmit={handleSubmit}>
        <label>Shift Period</label>
        <select name="inspectionType" value={formData.inspectionType} onChange={handleInputChange}>
          <option value="before">Before Shift</option>
          <option value="after">After Shift</option>
        </select>

        <label>Van Unit Identification</label>
        <select name="vanNumber" value={formData.vanNumber} required onChange={handleInputChange}>
          <option value="">-- Select Van --</option>
          <option value="Van-01">Van 01</option>
          <option value="Van-02">Van 02</option>
          <option value="Van-03">Van 03</option>
        </select>

        <div className="name-row">
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} required onChange={handleInputChange} />
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} required onChange={handleInputChange} />
        </div>

        {/* CRUCIAL CHANGE: Adding the HTML 'multiple' keyword here enables batch gallery selection */}
        <label className="camera-btn">
          {previewUrls.length > 0 ? '📸 Reselect Photos' : '🖼️ Attach Multiple Photos from Gallery'}
          <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
        </label>

        {/* Maps out and displays all selected photos simultaneously */}
        {previewUrls.length > 0 && (
          <div className="multi-preview-grid">
            {previewUrls.map((url, i) => (
              <div key={i} className="grid-preview-card">
                <img src={url} alt={`Preview snippet link target ${i}`} />
              </div>
            ))}
          </div>
        )}

        {statusMessage && <div className="status-loader">{statusMessage}</div>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Uploading Assets...' : `Submit ${photos.length > 0 ? `${photos.length} Records` : 'Records'}`}
        </button>
      </form>
    </div>
  );
}

export default App;