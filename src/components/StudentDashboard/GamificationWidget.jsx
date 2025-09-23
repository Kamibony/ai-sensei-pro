import React from 'react';

const GamificationWidget = () => {
  // Zde bude logika pro nacítání bodu a odznaku z Firestore
  const points = 1250;
  const badges = ['První Kvíz', 'Mistr Prezentací'];

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-2">Muj pokrok</h3>
      <p>Nasbírané body: <span className="font-bold text-blue-600">{points}</span></p>
      <div className="mt-2">
        <h4 className="font-semibold">Získané odznaky:</h4>
        <div className="flex space-x-2 mt-1">
          {badges.map(badge => <span key={badge} className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-sm">{badge}</span>)}
        </div>
      </div>
    </div>
  );
};

export default GamificationWidget;
