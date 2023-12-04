import React, { useState, useEffect } from "react";

const OfflinePage = () => {
  // show the UI only when client is offline
  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-2'>
      <div className='flex flex-col items-center justify-center'>
        <h1 className='text-4xl font-bold text-gray-900'>
          Kamu sedang offline
        </h1>
        <p className='text-lg text-gray-500'>
          Cek koneksi internet kamu dan refresh halaman ini
        </p>
      </div>
    </div>
  );
};

export default OfflinePage;
