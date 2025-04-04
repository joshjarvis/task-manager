import { useRef, useEffect } from 'react';
import { Task } from '@shared/schema';
import { CalendarViewType } from '@/lib/types';
import { getPriorityColorHex, ensureDate, formatDate, formatTime } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';

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

  // Log all tasks to help with debugging
  console.log("All tasks received:", tasks);
  
  // Convert tasks to calendar events
  const events = tasks
    .filter(task => task.scheduledStart && task.scheduledEnd)
    .map(task => {
      // Get Date objects for the scheduled times, making sure they're clean
      const startDate = new Date(task.scheduledStart!);
      const endDate = new Date(task.scheduledEnd!);
      
      // Calculate proper time display for debugging with timezone info
      const localTimeStart = startDate.toLocaleTimeString();
      const localTimeEnd = endDate.toLocaleTimeString();
      const utcTimeStart = startDate.toUTCString();
      const utcTimeEnd = endDate.toUTCString();

      // Get local timezone offset in hours
      const tzOffset = -(new Date().getTimezoneOffset()) / 60;
      const tzString = tzOffset >= 0 ? `+${tzOffset}` : `${tzOffset}`;
      
      console.log("Processing task for calendar:", {
        id: task.id,
        title: task.title,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        localStartTime: localTimeStart,
        localEndTime: localTimeEnd,
        utcStartTime: utcTimeStart,
        utcEndTime: utcTimeEnd,
        hours: startDate.getHours(),
        browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: tzString
      });
      
      return {
        id: task.id.toString(),
        title: task.title,
        start: startDate,  // Pass native Date objects directly to FullCalendar
        end: endDate,      // FullCalendar will handle timezone conversion internally
        backgroundColor: getPriorityColorHex(task.priority),
        borderColor: getPriorityColorHex(task.priority),
        classNames: [`${task.priority}-priority`],
        extendedProps: { task }
      };
    });

  const handleEventClick = (info: any) => {
    const task = info.event.extendedProps.task;
    onEditTask(task);
  };
  
  const handleDateClick = (info: any) => {
    console.log("Date clicked:", info.date);
    onDateChange(info.date);
    
    // If in month view, also change to day view for the clicked date
    if (view === 'month') {
      setView('day');
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.changeView('timeGridDay');
      }
    }
  };

  const handleViewChange = (viewType: CalendarViewType) => {
    setView(viewType);
    
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      // Change the view
      calendarApi.changeView(
        viewType === 'day' ? 'timeGridDay' : 
        viewType === 'week' ? 'timeGridWeek' : 
        'dayGridMonth'
      );
      
      // Make sure the date is properly synced when changing views
      console.log("View changed to:", viewType);
      console.log("Current calendar date:", calendarApi.getDate());
      onDateChange(calendarApi.getDate());
    }
  };

  const handlePrevClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.prev();
      // Get the new date and update parent component's state
      const newDate = calendarApi.getDate();
      console.log("Navigation: prev clicked, new date:", newDate);
      onDateChange(newDate);
    }
  };

  const handleNextClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.next();
      // Get the new date and update parent component's state
      const newDate = calendarApi.getDate();
      console.log("Navigation: next clicked, new date:", newDate);
      onDateChange(newDate);
    }
  };

  const handleTodayClick = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.today();
      // Get the new date and update parent component's state
      const newDate = calendarApi.getDate();
      console.log("Navigation: today clicked, new date:", newDate);
      onDateChange(newDate);
    }
  };

  // Update calendar when view or date changes
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.gotoDate(currentDate);
      console.log("Calendar updated with date:", calendarApi.getDate());
    }
  }, [currentDate]);
  
  // Log events when they change
  useEffect(() => {
    console.log("Current events:", events);
  }, [events]);

  const initialView = 
    view === 'day' ? 'timeGridDay' : 
    view === 'week' ? 'timeGridWeek' : 
    'dayGridMonth';

  return (
    <section className={className}>
      <div className="mb-4 flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-medium">Calendar</h2>
            <div className="flex border rounded-md overflow-hidden">
              <button 
                className={`px-3 py-1 text-sm ${view === 'day' ? 'bg-primary text-white' : ''}`}
                onClick={() => handleViewChange('day')}
              >
                Day
              </button>
              <button 
                className={`px-3 py-1 text-sm ${view === 'week' ? 'bg-primary text-white' : ''}`}
                onClick={() => handleViewChange('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 text-sm ${view === 'month' ? 'bg-primary text-white' : ''}`}
                onClick={() => handleViewChange('month')}
              >
                Month
              </button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 text-neutral-400 hover:text-neutral-500"
              onClick={handlePrevClick}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="font-medium">
              {currentDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <button 
              className="p-1 text-neutral-400 hover:text-neutral-500"
              onClick={handleNextClick}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button 
              className="px-3 py-1 text-sm border rounded-md ml-2 flex items-center space-x-1"
              onClick={handleTodayClick}
            >
              <CalendarClock className="h-4 w-4" />
              <span>Today</span>
            </button>
          </div>
        </div>
        
        {/* Timezone info */}
        <div className="mt-2 text-xs text-muted-foreground p-2 bg-muted rounded-md">
          <p>
            <strong>Note:</strong> This calendar displays times in UTC timezone. Working hours (9AM-5PM) are shown in UTC.
            Your local timezone is {Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC{
              -(new Date().getTimezoneOffset()) / 60 >= 0 ? 
              '+' + (-(new Date().getTimezoneOffset()) / 60) : 
              (-(new Date().getTimezoneOffset()) / 60)
            }).
          </p>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
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
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          timeZone="UTC"
          nowIndicator={true}
          editable={true}
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
