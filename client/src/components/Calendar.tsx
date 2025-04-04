import { useRef, useEffect } from 'react';
import { Task } from '@shared/schema';
import { CalendarViewType } from '@/lib/types';
import { getPriorityColorHex, ensureDate, formatDate, formatTime } from '@/lib/utils';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
      
      // Format time for debugging, showing both local browser time and UTC time
      const localTimeStart = startDate.toLocaleTimeString();
      const localTimeEnd = endDate.toLocaleTimeString();
      const utcTimeStart = startDate.toUTCString();
      const utcTimeEnd = endDate.toUTCString();
      
      console.log("Processing task for calendar:", {
        id: task.id,
        title: task.title,
        scheduledStart: task.scheduledStart,
        scheduledEnd: task.scheduledEnd,
        localStartTime: localTimeStart,
        localEndTime: localTimeEnd,
        utcStartTime: utcTimeStart,
        utcEndTime: utcTimeEnd,
        hours: startDate.getHours()
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
    onDateChange(info.date);
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

  // Update calendar when view or date changes, or when events are loaded
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      
      // Go to task date if there's a task
      if (events.length > 0) {
        try {
          // Try to extract the date from the first event
          const firstEventDate = new Date(events[0].start);
          console.log("Going to event date:", firstEventDate);
          calendarApi.gotoDate(firstEventDate);
        } catch (err) {
          console.error("Failed to parse event date:", err);
          // Fall back to current date
          calendarApi.gotoDate(currentDate);
        }
      } else {
        calendarApi.gotoDate(currentDate);
      }
      
      console.log("Calendar updated with date:", calendarApi.getDate());
      console.log("Current events:", events);
    }
  }, [currentDate, events]);

  const initialView = 
    view === 'day' ? 'timeGridDay' : 
    view === 'week' ? 'timeGridWeek' : 
    'dayGridMonth';

  return (
    <section className={className}>
      <div className="mb-4 flex justify-between items-center">
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
            <span className="material-icons">chevron_left</span>
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
            <span className="material-icons">chevron_right</span>
          </button>
          <button 
            className="px-3 py-1 text-sm border rounded-md ml-2"
            onClick={handleTodayClick}
          >
            Today
          </button>
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
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
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
