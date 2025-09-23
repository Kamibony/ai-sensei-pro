import React from 'react';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
};

export default Layout;
