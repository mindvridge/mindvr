import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { ko } from 'date-fns/locale';

// 한국 시간대
export const KOREA_TIMEZONE = 'Asia/Seoul';

/**
 * 한국 시간으로 날짜를 포맷팅합니다
 */
export const formatToKoreanTime = (date: string | Date, formatString: string = 'yyyy-MM-dd HH:mm:ss'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatInTimeZone(dateObj, KOREA_TIMEZONE, formatString, { locale: ko });
  } catch (error) {
    console.error('날짜 포맷팅 오류:', error);
    return '날짜 오류';
  }
};

/**
 * 현재 한국 시간을 반환합니다
 */
export const getCurrentKoreanTime = (): Date => {
  return toZonedTime(new Date(), KOREA_TIMEZONE);
};

/**
 * 한국 시간으로 ISO 문자열을 생성합니다
 */
export const getCurrentKoreanTimeISO = (): string => {
  const koreanTime = getCurrentKoreanTime();
  return formatInTimeZone(koreanTime, KOREA_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
};

/**
 * 날짜와 시간을 분리해서 표시합니다
 */
export const formatDateAndTime = (date: string | Date) => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const koreanDate = formatInTimeZone(dateObj, KOREA_TIMEZONE, 'yyyy-MM-dd', { locale: ko });
    const koreanTime = formatInTimeZone(dateObj, KOREA_TIMEZONE, 'HH:mm:ss', { locale: ko });
    return { date: koreanDate, time: koreanTime };
  } catch (error) {
    console.error('날짜 파싱 오류:', error);
    return { date: '날짜 오류', time: '시간 오류' };
  }
};

/**
 * 상대적 시간을 한국어로 표시합니다
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = getCurrentKoreanTime();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return formatToKoreanTime(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('상대적 시간 계산 오류:', error);
    return '시간 오류';
  }
};

/**
 * 기간을 계산합니다 (분 단위)
 */
export const calculateDuration = (startTime: string, endTime: string | null): number | null => {
  try {
    if (!endTime) return null;
    
    const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
    const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
    
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
  } catch (error) {
    console.error('기간 계산 오류:', error);
    return null;
  }
};