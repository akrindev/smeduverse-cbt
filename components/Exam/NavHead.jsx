import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { useExamInfo } from "../../store/useExamInfo";
import ExamUserInfo from "./ExamUserInfo";

export default function NavHead({ onTimeEnd }) {
  return (
    <ExamUserInfo>
      <Timer onTimeEnd={onTimeEnd} />
    </ExamUserInfo>
  );
}

const Timer = ({ onTimeEnd }) => {
  const [endTime, setEndTime] = useState(null);

  const examInfo = useExamInfo((state) => state.examInfo);

  const { end_time } = examInfo;

  const handleInterval = useCallback(() => {
    const time = new Date(end_time) - new Date();

    setEndTime((prev) => time);
  }, [setEndTime, end_time]);

  // listening to interval event
  useEffect(() => {
    if (endTime && endTime < 2000) onTimeEnd();

    const time = setInterval(handleInterval, 1000);

    return () => clearInterval(time);
  }, [endTime, handleInterval, onTimeEnd]);

  let hour = Math.floor((endTime / 3600000) % 24); // time diff's hours (modulated to 24)
  let min = Math.floor((endTime / 60000) % 60); // time diff's minutes (modulated to 60)
  let sec = Math.floor((endTime / 1000) % 60); // time diff's seconds (modulated to 60)

  return (
    <div
      className={`rounded-xl text-xs shadow-2xl px-4 py-1 font-semibold ${
        hour === 0 && min <= 5 ? "bg-red-700 text-white" : "bg-white"
      }`}>
      sisa waktu: {`${hour}j ${min}m ${sec}d`}
    </div>
  );
};
