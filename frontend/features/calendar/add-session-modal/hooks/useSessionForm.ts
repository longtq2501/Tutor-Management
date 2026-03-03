// ============================================================================
// FILE: add-session-modal/hooks/useSessionForm.ts
// ============================================================================
import { useState, useEffect } from 'react';

const getDefaultDate = () => new Date().toISOString().split('T')[0];

export const useSessionForm = (initialDate?: string, initialStudentId?: number | null) => {
  const [studentId, setStudentId] = useState<number>(initialStudentId || 0);
  const [sessions, setSessions] = useState(1);
  const [hoursPerSession, setHoursPerSession] = useState(2);
  const [sessionDate, setSessionDate] = useState(initialDate || getDefaultDate());
  const [subject, setSubject] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const calculateHours = (start: string, end: string) => {
    if (!start || !end) return;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    setHoursPerSession(diff / 60);
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    calculateHours(val, endTime);
  };

  const handleEndTimeChange = (val: string) => {
    setEndTime(val);
    calculateHours(startTime, val);
  };

  const totalHours = sessions * hoursPerSession;
  const month = sessionDate.substring(0, 7);

  const validate = () => {
    if (studentId === 0) {
      alert('Vui lòng chọn học sinh');
      return false;
    }
    if (sessions < 1 || hoursPerSession < 0.5 || !sessionDate) {
      alert('Vui lòng kiểm tra lại thông tin');
      return false;
    }
    return true;
  };

  return {
    studentId, setStudentId,
    sessions, setSessions,
    hoursPerSession, setHoursPerSession,
    sessionDate, setSessionDate,
    subject, setSubject,
    startTime, setStartTime: handleStartTimeChange,
    endTime, setEndTime: handleEndTimeChange,
    totalHours, month, validate
  };
};