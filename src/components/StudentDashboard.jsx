import React from 'react';
import { useTranslation } from 'react-i18next';
import GamificationWidget from './StudentDashboard/GamificationWidget';
// import CalendarView from './Dashboard/CalendarView';

const StudentDashboard = () => {
    const { t } = useTranslation();

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">{t('studentDashboard.title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow">Moje Lekce</div>
                <GamificationWidget />
                <div className="bg-white p-4 rounded-lg shadow">Nastavení</div>
            </div>
            {/* <CalendarView /> */}
        </div>
    );
};

export default StudentDashboard;
