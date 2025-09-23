import React from 'react';

const FullScreenLoader = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-50">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      {message && <p className="text-white text-xl mt-4">{message}</p>}
    </div>
  );
};

export default FullScreenLoader;
