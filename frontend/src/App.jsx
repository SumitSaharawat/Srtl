import React, { useState } from 'react';

export default function App() {
  const [file, setFile] = useState(null);
  const [vehicleId, setVehicleId] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !vehicleId) {
      setError('Please provide a file and a vehicle ID.');
      return;
    }
    
    setUploading(true);
    setError(null);
    setUploadedImageUrl(null);

    try {
      // 1. Get pre-signed upload URL from backend
      const urlRes = await fetch(
        `http://localhost:3000/get-upload-url?vehicleId=${encodeURIComponent(vehicleId)}&fileType=${encodeURIComponent(file.type)}`
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

      // 4. Update state to render the uploaded image
      setUploadedImageUrl(downloadUrl);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Vehicle Image Uploader</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>Vehicle ID:</label>
        <input 
          type="text" 
          value={vehicleId} 
          onChange={(e) => setVehicleId(e.target.value)} 
          placeholder="e.g. JAG-123" 
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>Image File:</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          style={{ width: '100%', padding: '0.5rem' }}
        />
      </div>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

      <button 
        onClick={handleUpload} 
        disabled={uploading} 
        style={{ 
          padding: '0.75rem 1.5rem', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {uploadedImageUrl && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Uploaded Image:</h3>
          <img 
            src={uploadedImageUrl} 
            alt="Uploaded Vehicle" 
            style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
          />
        </div>
      )}
    </div>
  );
}