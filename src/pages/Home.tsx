import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const navigate=useNavigate()

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        alert('Please upload an image file');
      }
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        alert('Please upload an image file');
      }
    }
  };

 const handleImageUpload = (file) => {
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;
    sessionStorage.setItem('uploadedImage', base64);
    sessionStorage.setItem('uploadedImageName', file.name);

    // ✅ Use navigation instead of full reload
    navigate('/Result');
  };
  reader.readAsDataURL(file);
};

  const handleGetStartedClick = (e) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="px-4 lg:px-10 py-4 lg:py-6 min-h-screen lg:h-screen overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="inline-flex items-center gap-1 lg:gap-2 text-[10px] lg:text-xs mb-3 lg:mb-4 w-auto p-[4px] lg:p-[5px] rounded-full bg-accent/80">
          <span className="bg-primary/15 text-primary px-1.5 lg:px-2 py-0.5 rounded-full text-[10px] lg:text-xs">🚀 Let's <span className="font-bold">toyify</span></span>
          <span className="text-primary/85 text-[10px] lg:text-xs">tangible treasures <span><img src="./arrow.png" alt="Arrow" className="inline-block w-2 lg:w-3 h-2 lg:h-3 ml-1" /></span></span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-start">
          {/* Left Column */}
          <div>
            <h1 className="font-heading text-2xl lg:text-4xl font-bold text-foreground leading-tight mb-2 lg:mb-4">
              A platform to make<br />
              your drawings into<br />
              <span className="text-[#9E77ED]">real toys</span>
            </h1>

            <p className="text-muted-foreground mb-4 lg:mb-6 text-xs lg:text-sm">
              Transform any drawing, scribble, doodle and mark-making into real toys and preview it for free
            </p>

            {/* Upload Box - Hidden on mobile, shown on desktop */}
            <div 
              className={`hidden lg:block toyify-upload-zone py-16 px-16 text-center transition-colors ${
                isDragging ? 'border-[#7F56D9] bg-[#F4EBFF]' : 'border-[#9E77ED]'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="text-muted-foreground mb-4 text-sm">
                {isDragging ? 'Drop your drawing here' : 'Drag & drop your drawing here to upload'}
              </p>
              <button 
                onClick={handleGetStartedClick}
                className="bg-[#7F56D9] text-white px-8 py-2.5 rounded-full hover:bg-[#6941C6] transition font-semibold text-sm shadow-md shadow-[#7F56D9]/30"
              >
                Get started for free
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="relative flex flex-col items-center justify-start lg:-translate-y-20">

            {/* Upload Box - Mobile Only, positioned before images */}
            <div 
              className={`lg:hidden w-[90%] toyify-upload-zone py-4 px-10 text-center mb-3 relative z-10 transition-colors ${
                isDragging ? 'border-[#7F56D9] bg-[#F4EBFF]' : 'border-[#9E77ED]'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p className="text-muted-foreground mb-2 text-xs">
                {isDragging ? 'Drop your drawing here' : 'Drag & drop your drawing here to upload'}
              </p>
              <button 
                onClick={handleGetStartedClick}
                className="bg-[#7F56D9] text-white px-6 py-2 rounded-full hover:bg-[#6941C6] transition font-semibold text-xs shadow-md shadow-[#7F56D9]/30"
              >
                Get started for free
              </button>
            </div>

            {/* Cartoon Image */}
            <div className="
                relative w-full flex justify-center 
                -mt-[100px] lg:mt-0
                scale-[0.85] xs:scale-[0.9] sm:scale-100
                origin-top
              ">
              <img
                src="./Hero Video 2 1.png"
                alt="Toy Preview"
                className="w-full h-auto max-w-[300px] lg:max-w-md"
              />

              {/* Feature Image*/}
              <img
                src="./Video frame.png"
                alt="Ready in 5-7 days"
                className="
                  absolute
                  bottom-[-20px] lg:bottom-[-10px]
                  h-50 lg:h-[220px]
                  w-auto
                  -rotate-6
                  hover:rotate-0
                  transition
                  "
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}