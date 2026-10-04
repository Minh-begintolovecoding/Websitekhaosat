import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ExperimentalGroup,
  ParticipantSessionData,
  SurveyAnswers,
  TimingMetrics,
} from '../types/experiment.ts';
import {
  getStoredParticipantUuid,
  storeParticipantUuid,
  STORAGE_KEYS,
} from '../utils/storage.ts';

interface ExperimentContextType {
  participantUuid: string | null;
  groupType: ExperimentalGroup | null;
  hasSubmitted: boolean;
  isLoading: boolean;
  error: string | null;
  timings: TimingMetrics;
  surveyAnswers: SurveyAnswers;
  initializeParticipant: (overrideGroup?: ExperimentalGroup) => Promise<ParticipantSessionData | null>;
  setAnswer: (key: keyof SurveyAnswers, value: any) => void;
  recordProductEnter: () => void;
  recordProductExit: () => void;
  recordCartEnter: () => void;
  recordCartExit: () => void;
  recordSurveyStart: () => void;
  submitSurveyAnswers: () => Promise<{ success: boolean; isSpeeding?: boolean; error?: string }>;
  resetLocalParticipant: () => void;
}

const ExperimentContext = createContext<ExperimentContextType | null>(null);

export const ExperimentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participantUuid, setParticipantUuid] = useState<string | null>(() => getStoredParticipantUuid());
  const [groupType, setGroupType] = useState<ExperimentalGroup | null>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ASSIGNED_GROUP) as ExperimentalGroup) || null;
  });
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SUBMITTED) === 'true';
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Timings
  const [timings, setTimings] = useState<TimingMetrics>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TIMINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      productPageDuration: 0,
      cartPageDuration: 0,
      surveyDuration: 0,
      totalDuration: 0,
    };
  });

  // Survey Draft
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SURVEY_DRAFT);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  // Save timings to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIMINGS, JSON.stringify(timings));
  }, [timings]);

  // Auto-save survey draft
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SURVEY_DRAFT, JSON.stringify(surveyAnswers));
  }, [surveyAnswers]);

  // Initialize or resume participant
  const initializeParticipant = async (overrideGroup?: ExperimentalGroup): Promise<ParticipantSessionData | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const storedUuid = getStoredParticipantUuid();

      const res = await fetch('/api/participant/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantUuid: storedUuid,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize experiment session');
      }

      const activeGroup = overrideGroup || (data.groupType as ExperimentalGroup);
      setParticipantUuid(data.participantUuid);
      setGroupType(activeGroup);
      setHasSubmitted(Boolean(data.hasSubmitted));

      storeParticipantUuid(data.participantUuid);
      localStorage.setItem(STORAGE_KEYS.ASSIGNED_GROUP, activeGroup);
      if (data.hasSubmitted) {
        localStorage.setItem(STORAGE_KEYS.SUBMITTED, 'true');
      }

      return {
        participantUuid: data.participantUuid,
        groupType: activeGroup,
        hasSubmitted: Boolean(data.hasSubmitted),
      };
    } catch (err: any) {
      console.error('Participant initialization error:', err);
      setError(err.message || 'Error initializing experiment');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Timing handlers
  const recordProductEnter = () => {
    setTimings((prev) => ({
      ...prev,
      enteredProductPageAt: prev.enteredProductPageAt || Date.now(),
    }));
  };

  const recordProductExit = () => {
    setTimings((prev) => {
      const start = prev.enteredProductPageAt || Date.now();
      const dur = Math.max(1, Math.round((Date.now() - start) / 1000));
      return {
        ...prev,
        productPageDuration: dur,
      };
    });
  };

  const recordCartEnter = () => {
    setTimings((prev) => ({
      ...prev,
      enteredCartPageAt: prev.enteredCartPageAt || Date.now(),
    }));
  };

  const recordCartExit = () => {
    setTimings((prev) => {
      const start = prev.enteredCartPageAt || Date.now();
      const dur = Math.max(1, Math.round((Date.now() - start) / 1000));
      return {
        ...prev,
        cartPageDuration: dur,
      };
    });
  };

  const recordSurveyStart = () => {
    setTimings((prev) => ({
      ...prev,
      startedSurveyAt: prev.startedSurveyAt || Date.now(),
    }));
  };

  const setAnswer = (key: keyof SurveyAnswers, value: any) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitSurveyAnswers = async () => {
    if (!participantUuid) {
      return { success: false, error: 'Chưa xác định định danh người tham gia.' };
    }

    try {
      const surveyStart = timings.startedSurveyAt || Date.now() - 30000;
      const surveyDur = Math.max(1, Math.round((Date.now() - surveyStart) / 1000));
      const totalDur = timings.productPageDuration + timings.cartPageDuration + surveyDur;

      const payload = {
        participantUuid,
        ...surveyAnswers,
        productPageDuration: timings.productPageDuration || 1,
        cartPageDuration: timings.cartPageDuration || 1,
        surveyDuration: surveyDur,
        totalDuration: totalDur,
        startedAt: new Date(timings.enteredProductPageAt || Date.now() - totalDur * 1000).toISOString(),
      };

      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi khi gửi phản hồi khảo sát');
      }

      setHasSubmitted(true);
      localStorage.setItem(STORAGE_KEYS.SUBMITTED, 'true');
      localStorage.removeItem(STORAGE_KEYS.SURVEY_DRAFT);

      return {
        success: true,
        isSpeeding: data.isSpeeding,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Lỗi hệ thống khi gửi dữ liệu khảo sát',
      };
    }
  };

  const resetLocalParticipant = () => {
    localStorage.removeItem(STORAGE_KEYS.PARTICIPANT_UUID);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNED_GROUP);
    localStorage.removeItem(STORAGE_KEYS.SUBMITTED);
    localStorage.removeItem(STORAGE_KEYS.TIMINGS);
    localStorage.removeItem(STORAGE_KEYS.SURVEY_DRAFT);
    if (typeof document !== 'undefined') {
      document.cookie = `${STORAGE_KEYS.PARTICIPANT_UUID}=; Max-Age=0; path=/;`;
    }
    setParticipantUuid(null);
    setGroupType(null);
    setHasSubmitted(false);
    setSurveyAnswers({});
    setTimings({
      productPageDuration: 0,
      cartPageDuration: 0,
      surveyDuration: 0,
      totalDuration: 0,
    });
  };

  return (
    <ExperimentContext.Provider
      value={{
        participantUuid,
        groupType,
        hasSubmitted,
        isLoading,
        error,
        timings,
        surveyAnswers,
        initializeParticipant,
        setAnswer,
        recordProductEnter,
        recordProductExit,
        recordCartEnter,
        recordCartExit,
        recordSurveyStart,
        submitSurveyAnswers,
        resetLocalParticipant,
      }}
    >
      {children}
    </ExperimentContext.Provider>
  );
};

export const useExperiment = () => {
  const context = useContext(ExperimentContext);
  if (!context) {
    throw new Error('useExperiment must be used within an ExperimentProvider');
  }
  return context;
};
