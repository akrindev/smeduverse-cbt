import Head from "next/head";

import { useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

import { api } from "../../lib/hooks/auth";
import ExamBegin from "../../components/Layouts/ExamBegin";
import NavHead from "../../components/Exam/NavHead";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";
import QuestionComponent from "../../components/Exam/QuestionComponent";

export default function ExamIndex() {
  const questions = useExamQuestions((state) => state.questions);
  const examInfo = useExamInfo((state) => state.examInfo);
  const setWarn = useExamInfo((state) => state.setWarn);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);

  useEffect(() => {
    if (questions.length <= 0 && savedAnswers.length <= 0) {
      if (typeof window !== "undefined") {
        // console.log("test", questions, savedAnswers);
        window.location.href = "/dashboard";
      }
    }
  }, [questions, savedAnswers]);

  const handleWarn = useCallback(
    async (event) => {
      await api
        .patch("/api/exam/warn-exam", {
          sheet_id: examInfo.sheet_id,
        })
        .then((res) => {
          setWarn({
            warn: res.data?.warn || 0,
          });
        })
        .catch((err) => console.error(err));

      toast.error("Kamu meninggalkan halaman ujian, peringatan ditambahkan");
      const sound = new Audio("/assets/sounds/goes.ogg");
      sound.play();
    },
    [examInfo, setWarn]
  );

  const isProtectedSelection = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element =
      container?.nodeType === 1
        ? container
        : container?.parentElement;

    return Boolean(
      element?.closest && element.closest("[data-exam-protected='true']")
    );
  }, []);

  const isProtectedTarget = useCallback((target) => {
    return Boolean(
      target instanceof Element &&
        target.closest("[data-exam-protected='true']")
    );
  }, []);

  // prevent leave window
  useEffect(() => {
    if (typeof global.window !== "undefined" && examInfo.warnEnabled) {
      global.window.addEventListener("blur", handleWarn);
    }

    return () => {
      if (typeof global.window !== "undefined" && examInfo.warnEnabled) {
        global.window.removeEventListener("blur", handleWarn);
      }
    };
  }, [handleWarn, examInfo]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const preventProtectedClipboard = (event) => {
      if (isProtectedTarget(event.target) || isProtectedSelection()) {
        event.preventDefault();
      }
    };

    const preventProtectedShortcuts = (event) => {
      const key = event.key?.toLowerCase();
      const isClipboardShortcut =
        (event.ctrlKey || event.metaKey) &&
        ["c", "x", "a", "s", "p", "u"].includes(key);
      const isPrintScreen = key === "printscreen";

      if (
        isPrintScreen ||
        ((isClipboardShortcut || key === "f12") &&
          (isProtectedTarget(event.target) || isProtectedSelection()))
      ) {
        event.preventDefault();
      }
    };

    document.body.classList.add("exam-secure-mode");
    document.addEventListener("copy", preventProtectedClipboard, true);
    document.addEventListener("cut", preventProtectedClipboard, true);
    document.addEventListener("contextmenu", preventProtectedClipboard, true);
    document.addEventListener("dragstart", preventProtectedClipboard, true);
    document.addEventListener("keydown", preventProtectedShortcuts, true);

    return () => {
      document.body.classList.remove("exam-secure-mode");
      document.removeEventListener("copy", preventProtectedClipboard, true);
      document.removeEventListener("cut", preventProtectedClipboard, true);
      document.removeEventListener(
        "contextmenu",
        preventProtectedClipboard,
        true
      );
      document.removeEventListener(
        "dragstart",
        preventProtectedClipboard,
        true
      );
      document.removeEventListener("keydown", preventProtectedShortcuts, true);
    };
  }, [isProtectedSelection, isProtectedTarget]);

  return (
    <>
      <Head>
        <title>Mengerjakan Ujian</title>
      </Head>
      <ExamBegin header={<NavHead examInfo={examInfo} />}>
        <QuestionComponent />
      </ExamBegin>
      <ToastContainer />
    </>
  );
}
