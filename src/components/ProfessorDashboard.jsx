import React from 'react';
import { useTranslation } from 'react-i18next';
// Predpokl�d�me, �e CalendarView bude vytvoren v dal��m kroku
// import CalendarView from './Dashboard/CalendarView'; 

const ProfessorDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{t('professorDashboard.title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Zde budou komponenty dashboardu */}
        <div className="bg-white p-4 rounded-lg shadow">Lekce</div>
        <div className="bg-white p-4 rounded-lg shadow">Studenti</div>
        <div className="bg-white p-4 rounded-lg shadow">Nastaven�</div>
      </div>
      {/* M�sto pro kalend�r */}
      {/* <CalendarView /> */}
    </div>
  );
};

export default ProfessorDashboard;
