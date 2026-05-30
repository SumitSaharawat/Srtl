// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/inspections';

export const getPresignedUrl = async (vanNumber, contentType, inspectionType) => {
  const response = await axios.post(`${API_BASE_URL}/get-presigned-url`, {
    vanNumber,
    contentType,
    inspectionType,
  });
  return response.data;
};

export const uploadToS3 = async (uploadUrl, file) => {
  return await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
  });
};

export const submitInspectionLog = async (payload) => {
  const response = await axios.post(`${API_BASE_URL}/submit-inspection`, payload);
  return response.data;
};

export const getDashboardRecords = async (params) => {
  const response = await axios.get(`${API_BASE_URL}/dashboard`, { params });
  return response.data;
};