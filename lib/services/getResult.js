import Router from "next/router";
import { toast } from "react-toastify";
import { api } from "../hooks/auth";

export const getResult = async (
  sheetId,
  { onBeforeNavigate } = {}
) => {
  if (typeof onBeforeNavigate !== "function") {
    throw new Error("onBeforeNavigate is required");
  }

  return new Promise((resolve, reject) => {
    api
      .post("/api/exam/get-result", {
        sheet_id: sheetId,
      })
      .then((res) => {
        if (res.status == 200) {
          toast.success("Lembar Ujian berhasil di kumpulkan");
          //    remove local storaage exam and answer
          setTimeout(() => {
            try {
              localStorage.removeItem("zustand-exam-questions");
              localStorage.removeItem("zustand-exam-saved-answers");
              localStorage.removeItem("zustand-exam-info");
              onBeforeNavigate();
              const navigation = Router.replace("/exam/selesai");
              if (navigation && typeof navigation.then === "function") {
                navigation.then(() => resolve(res.data), reject);
                return;
              }
              resolve(res.data);
            } catch (error) {
              reject(error);
            }
          }, 1200);
          return;
        }

        const error = new Error(`HTTP ${res.status}`);
        toast.error("Lembar Ujian belum berhasil dikumpulkan");
        reject(error);
      })
      .catch((err) => {
        toast.error("Lembar Ujian belum berhasil dikumpulkan");
        reject(err);
      });
  });
};
