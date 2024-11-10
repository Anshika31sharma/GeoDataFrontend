"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

const App = () => {
  const [users, setUsers] = useState([]);
  const [files, setFiles] = useState([]);
  const [points, setPoints] = useState([]);
  const [userData, setUserData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [fileData, setFileData] = useState({
    user_id: "",
    file_name: "",
    file_type: "",
    file_url: "",
  });
  const [pointData, setPointData] = useState({
    user_id: "",
    lat: "",
    lon: "",
    label: "",
  });
  const [loading, setLoading] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    setFileData({
      ...fileData,
      file_name: file.name,
      file_type: file.type,
      file_url: file,
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ".geojson, .kml, .tiff",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const usersRes = await axios.get(`${apiUrl}/api/users`);
      setUsers(usersRes.data);
      const filesRes = await axios.get(`${apiUrl}/api/files`);
      setFiles(filesRes.data);
      const pointsRes = await axios.get(`${apiUrl}/api/points`);
      setPoints(pointsRes.data);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const createUser = async (e) => {
    e.preventDefault();
    if (!userData.username || !userData.password || !userData.email) {
      return alert("Please fill in all fields.");
    }
    alert("Creating user...");
    setUserData({ username: "", password: "", email: "" });
    setLoading(true);
    try {
      const response = await axios.post(`${apiUrl}/api/users`, userData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.status === 201) {
        alert("User created successfully!");
        setUserData({ username: "", password: "", email: "" });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating user", error);
      alert("Error creating user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (e) => {
    e.preventDefault();
    if (!fileData.file_name || !fileData.file_url) {
      return alert("Please select a file to upload.");
    }

    const formData = new FormData();
    formData.append("file", fileData.file_url);
    formData.append("user_id", fileData.user_id);

    setLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/files/upload`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      if (response.status === 200) {
        alert("File uploaded successfully!");
        setFileData({
          user_id: "",
          file_name: "",
          file_type: "",
          file_url: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error uploading file", error);
      alert("Error uploading file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 p-6">
      <h1 className="text-4xl font-bold text-center mb-8">Geodata App</h1>

      <div className="flex justify-between gap-4 w-full">
        <div className="bg-white p-2 w-full rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">Create User</h2>
          <form onSubmit={createUser} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={userData.username}
              onChange={(e) =>
                setUserData({ ...userData, username: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={userData.password}
              onChange={(e) =>
                setUserData({ ...userData, password: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={userData.email}
              onChange={(e) =>
                setUserData({ ...userData, email: e.target.value })
              }
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
              disabled={loading}
            >
              Create User
            </button>
          </form>
        </div>

        <div className="bg-white p-2 w-full rounded-lg shadow-md mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Drag and Drop File Upload
          </h2>
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer rounded-md"
          >
            <input {...getInputProps()} />
            <p className="text-gray-600">
              Drag and drop a .geojson, .kml, or .tiff file here, or click to
              select files
            </p>
          </div>
          {fileData.file_name && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold">File Details</h3>
              <p>File Name: {fileData.file_name}</p>
              <p>File Type: {fileData.file_type}</p>
              <p>
                File URL:{" "}
                <a
                  href={URL.createObjectURL(fileData.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  View File
                </a>
              </p>
              <button
                onClick={uploadFile}
                className="mt-4 py-3 px-6 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600"
                disabled={loading}
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>

      <Map points={pointsToDisplay} />
    </div>
  );
};

export default App;
