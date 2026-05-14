import React, { useState } from 'react';

export default function App() {
  const [files, setFiles] = useState([]);
  const [vehicleId, setVehicleId] = useState('');
  const [uploadedImageUrls, setUploadedImageUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !vehicleId) {
      setError('Please provide at least one file and a vehicle ID.');
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

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h2>Vehicle Image Uploader</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>Vehicle ID:</label>
        <select 
          value={vehicleId} 
          onChange={(e) => setVehicleId(e.target.value)} 
          style={{ width: '100%', padding: '0.5rem' }}
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

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '.5rem', fontWeight: 'bold' }}>Image Files:</label>
        <input 
          type="file" 
          accept="image/*" 
          multiple
          onChange={handleFileChange} 
          style={{ width: '100%', padding: '0.5rem' }}
        />
        {files.length > 0 && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#555' }}>
            {files.length} file(s) ready for upload
          </p>
        )}
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
        {uploading ? 'Uploading...' : 'Upload Images'}
      </button>

      {uploadedImageUrls.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Uploaded Images:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
            {uploadedImageUrls.map((url, idx) => (
              <img 
                key={idx}
                src={url} 
                alt={`Uploaded Vehicle ${idx + 1}`} 
                style={{ width: '100%', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}