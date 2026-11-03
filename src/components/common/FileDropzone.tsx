import React, { useState } from 'react';

/**
 * Vùng thả file kéo-thả dùng chung cho các workflow tạo ảnh trong Studio.
 * Tách ra từ App.tsx (trước đây định nghĩa cục bộ, dùng lặp lại ở nhiều
 * workflow) để nhiều component workflow có thể import trực tiếp.
 */
export const FileDropzone: React.FC<React.HTMLAttributes<HTMLDivElement> & { onFilesDrop: (files: FileList) => void }> = ({ onFilesDrop, className, children, ...props }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDrop(e.dataTransfer.files);
    }
  };

  return (
    <div
      {...props}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className || ''} ${isDragActive ? '!border-[#1877F2] !bg-[#1877F2]/10 transition-all' : ''}`}
    >
      {children}
    </div>
  );
};
