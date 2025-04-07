import { useRef, useEffect } from 'react';
import { Task } from '@shared/schema';
import { CalendarViewType } from '@/lib/types';
import { getPriorityColorHex } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  tasks: Task[];
  view: CalendarViewType;
  setView: (view: CalendarViewType) => void;
  onEditTask: (task: Task) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  className?: string;
}

export default function Calendar({
  tasks,
  view,
  setView,
  onEditTask,
  currentDate,
  onDateChange,
  className = "",
}: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  
  // Map tasks to calendar events
  const events = tasks
    .filter(task => task.scheduledStart && task.scheduledEnd)
    .map(task => {
      return {
        id: task.id.toString(),
        title: task.title,
        start: task.scheduledStart,
        end: task.scheduledEnd,
        backgroundColor: getPriorityColorHex(task.priority),
        borderColor: "transparent",
        classNames: [`${task.priority}-priority`],
        extendedProps: { task }
      };
    });

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    onEditTask(task);
  };
  
  const handleDateClick = (info: any) => {
    onDateChange(info.date);
    
    if (view === 'month') {
      setView('day');
      if (calendarRef.current) {
        calendarRef.current.getApi().changeView('timeGridDay');
      }
    }
  };

  const handleViewChange = (viewType: CalendarViewType) => {
    setView(viewType);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      calendarApi.changeView(
        viewType === 'day' ? 'timeGridDay' : 
        viewType === 'week' ? 'timeGridWeek' : 
        'dayGridMonth'
      );
      
      onDateChange(calendarApi.getDate());
    }
  };

  const handlePrevClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      onDateChange(calendarApi.getDate());
    }
  };

  const handleNextClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      onDateChange(calendarApi.getDate());
    }
  };

  const handleTodayClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      onDateChange(calendarApi.getDate());
    }
  };

  // Update calendar when view or date changes
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.getApi().gotoDate(currentDate);
    }
  }, [currentDate]);
  
  const initialView = 
    view === 'day' ? 'timeGridDay' : 
    view === 'week' ? 'timeGridWeek' : 
    'dayGridMonth';

  return (
    <section className={className}>
      <div className="mb-4 p-4 bg-white border border-gray-100 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-medium text-gray-800">Calendar</h2>
            <div className="flex border border-gray-200 rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'day' 
                    ? 'bg-blue-50 text-blue-600 border-r border-gray-200' 
                    : 'bg-white text-gray-600 border-r border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleViewChange('day')}
              >
                Day
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'week' 
                    ? 'bg-blue-50 text-blue-600 border-r border-gray-200' 
                    : 'bg-white text-gray-600 border-r border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleViewChange('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'month' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => handleViewChange('month')}
              >
                Month
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              onClick={handlePrevClick}
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <button 
              className="btn-macos px-3 py-1 text-xs font-medium animate-scale"
              onClick={handleTodayClick}
            >
              Today
            </button>
            
            <button 
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              onClick={handleNextClick}
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <h3 className="font-medium text-sm text-gray-700 mt-3">
          {currentDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </h3>
      </div>

      <div className="calendar-container flex-grow overflow-y-auto" style={{ height: 'calc(100vh - 220px)' }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={initialView}
          headerToolbar={false}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          height="100%"
          initialDate={currentDate}
          allDaySlot={false}
          // Show the full day, not just working hours
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          // Highlight business hours
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
            startTime: '09:00',
            endTime: '17:00',
          }}
          slotLabelFormat={{
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }}
          expandRows={true}
          nowIndicator={true}
          editable={true}
          dayCellClassNames="hover:bg-blue-50"
          eventBorderRadius={4}
          eventDisplay="block"
          eventDrop={(info) => {
            // Handle event drops for rescheduling
            const taskId = parseInt(info.event.id);
            const task = tasks.find(t => t.id === taskId);
            
            if (task) {
              const updatedTask = {
                ...task,
                scheduledStart: info.event.start,
                scheduledEnd: info.event.end
              };
              onEditTask(updatedTask);
            }
          }}
        />
      </div>
    </section>
  );
}
