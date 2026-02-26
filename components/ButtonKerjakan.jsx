import { useState, useEffect } from "react";
import { parseServerTimeMs } from "../lib/serverClock";

export default function ButtonKerjakan({ onClick, schedule, trustedNowMs }) {
  const [countDown, setCountDown] = useState(10);

  const startTimeMs = parseServerTimeMs(schedule?.start_time);
  const endTimeMs = parseServerTimeMs(schedule?.end_time);
  const hasNowMs = Number.isFinite(trustedNowMs);

  useEffect(() => {
    if (schedule && schedule.answer_sheets[0]?.status != 2) {
      const interval = setInterval(() => {
        countDown > 0 ? setCountDown(countDown - 1) : clearInterval(interval);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [countDown, schedule]);

  if (schedule && schedule.answer_sheets[0]?.status == 2) {
    return (
      <div className='text-center text-rose-100 px-4 py-1 bg-rose-800 opacity-50'>
        dikumpulkan
      </div>
    );
  }

  if (!hasNowMs) {
    return (
      <div className="text-center">
        <button className="w-full bg-gray-400 text-white px-4 py-1 opacity-50">
          sinkronisasi waktu...
        </button>
      </div>
    );
  }

  if (Number.isFinite(startTimeMs) && startTimeMs > trustedNowMs) {
    return (
      <div className="text-center">
        <button className="w-full bg-green-600 text-white px-4 py-1 opacity-50">
          terjadwal
        </button>
      </div>
    );
  }

  if (Number.isFinite(endTimeMs) && endTimeMs < trustedNowMs) {
    return (
      <div className="text-center">
        <button className="w-full bg-red-500 text-white px-4 py-1 opacity-50">
          telah berakhir
        </button>
      </div>
    );
  }

  if (schedule && schedule.answer_sheets.length == 0) {
    return (
      <div className='text-center'>
        <button
          className='w-full bg-green-500 px-4 py-1 font-semibold text-white shadow'
          onClick={onClick}>
          Kerjakan
        </button>
      </div>
    );
  }

  if (schedule && schedule.answer_sheets[0]?.status != 2) {
    return (
      <div className='text-center'>
        <button
          className='w-full bg-yellow-500 px-4 py-1 font-semibold text-white shadow disabled:bg-opacity-40'
          onClick={onClick}
          disabled={countDown > 0}>
          {countDown > 0 ? `lanjutkan dalam ${countDown}d` : "Lanjutkan"}
        </button>
      </div>
    );
  }
}
