import React from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const CalendarView = () => {
  // Zde bude logika pro nacítání událostí z Firestore
  const events = [
    {
      title: 'Odevzdat test z Kapitoly 5',
      start: new Date(2025, 9, 28, 10, 0),
      end: new Date(2025, 9, 28, 12, 0),
    },
  ];

  return (
    <div className="mt-8 bg-white p-4 rounded-lg shadow">
      <h3 className="text-xl font-bold mb-4">Kalendár a termíny</h3>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
};

export default CalendarView;
