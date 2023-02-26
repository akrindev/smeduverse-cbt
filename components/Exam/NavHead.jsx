import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useCallback, useState, useEffect, useMemo } from "react";
import { useExamInfo } from "../../store/useExamInfo";
import ExamUserInfo from "./ExamUserInfo";
import { getResult } from "../../lib/services/getResult";
import { toast } from "react-toastify";
import { useExamTime } from "../../store/useExamTime";

export default function NavHead() {
  return (
    <ExamUserInfo>
      <Timer />
    </ExamUserInfo>
  );
}

const Timer = () => {
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);

  const [endTime, setEndTime] = useState(null);

  const examInfo = useExamInfo((state) => state.examInfo);
  const setSubmitable = useExamTime((state) => state.setSubmitable);

  const { end_time } = examInfo;

  const handleInterval = useCallback(() => {
    const time = new Date(end_time) - new Date();

    setEndTime((prev) => time);
  }, [setEndTime, end_time]);

  // listening to interval event
  useEffect(() => {
    if (endTime && endTime < 2000) {
      getResult(savedAnswers && savedAnswers[0]?.exam_answer_sheet_id).then(
        (res) => {
          toast.success("ujian di selesaikan");
        }
      );

      return;
    }

    if (hour == 0 && min <= 15) {
      setSubmitable({ submitable: true });
    } else {
      setSubmitable({ submitable: false });
    }

    const time = setInterval(handleInterval, 1000);

    return () => clearInterval(time);
  }, [endTime, handleInterval, savedAnswers, min, hour, setSubmitable]);

  const [hour, min, sec] = useMemo(() => {
    let hour = Math.floor((endTime / 3600000) % 24); // time diff's hours (modulated to 24)
    let min = Math.floor((endTime / 60000) % 60); // time diff's minutes (modulated to 60)
    let sec = Math.floor((endTime / 1000) % 60); // time diff's seconds (modulated to 60)
    return [hour, min, sec];
  }, [endTime]);

  return (
    <div
      className={`rounded-xl text-xs shadow-2xl px-4 py-1 font-semibold ${
        hour === 0 && min <= 5 ? "bg-red-700 text-white" : "bg-white"
      }`}
    >
      sisa waktu: {`${hour}j ${min}m ${sec}d`}
    </div>
  );
};
