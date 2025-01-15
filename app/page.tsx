'use client';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function Home() {
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [columns, setColumns] = useState<Record<string, string[]>>({});
  const [mergedData, setMergedData] = useState<Record<string, any[]>>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFileNames(files.map((file) => file.name));
    const tempColumns: Record<string, string[]> = {};
    const tempData: Record<string, any[]> = {};

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (json.length > 0) {
          const headers = json[0] as string[];
          tempColumns[file.name] = headers;

          headers.forEach((header) => {
            if (!tempData[header]) tempData[header] = [];
          });

          json.slice(1).forEach((row) => {
            headers.forEach((header, index) => {
              tempData[header].push(row[index] || '');
            });
          });
        }

        setColumns({ ...tempColumns });
        setMergedData(tempData);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const downloadMergedExcel = () => {
    const sheetData = [Object.keys(mergedData)];
    const maxRows = Math.max(...Object.values(mergedData).map((col) => col.length));

    for (let i = 0; i < maxRows; i++) {
      const row = Object.keys(mergedData).map((key) => mergedData[key][i] || '');
      sheetData.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Merged Data');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'merged_data.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Excel 合并工具</h1>

        <input
          type="file"
          accept=".xlsx, .xls"
          multiple
          onChange={handleFileUpload}
          className="block w-full mb-6 p-2 border border-gray-300 rounded-md"
        />

        {fileNames.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-center mb-4">已上传文件：</h2>
            <ul className="flex flex-wrap justify-center gap-4">
              {fileNames.map((name, index) => (
                <li key={index} className="bg-gray-200 px-4 py-2 rounded-md shadow-sm">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        )}
        {mergedData && Object.keys(mergedData).length > 0 && (
          <div className="text-center">
            <button
              onClick={downloadMergedExcel}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
            >
              下载合并结果
            </button>
          </div>
        )}

        {Object.keys(columns).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-center mb-4">文件列名：</h2>
            <div className="grid grid-cols-3 gap-6">
              {Object.entries(columns).map(([fileName, headers], index) => (
                <div key={index} className="bg-gray-100 p-4 rounded-md shadow">
                  <h3 className="font-medium text-center mb-2">{fileName}:</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {headers.map((header, i) => (
                      <span
                        key={i}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm text-center"
                      >
                        {header}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
