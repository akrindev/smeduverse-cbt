import useSWR from "swr";
import Axios from "axios";
import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";

const api = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

const getAxiosErrorMessage = (error) => {
  const status = error?.response?.status;

  if (!status) {
    return "Tidak dapat terhubung ke server. Periksa koneksi, CORS, atau SSL backend.";
  }

  if (status >= 500) {
    return "Server sedang bermasalah. Silakan coba lagi beberapa saat.";
  }

  return error?.response?.data?.message || "Login gagal. Silakan cek data kamu.";
};

const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
  const router = useRouter();

  const {
    data: user,
    error,
    mutate,
  } = useSWR("/api/user", () =>
    api
      .get("/api/user")
      .then((res) => res?.data || null)
      .catch((error) => {
        const status = error?.response?.status;
        if (status && status !== 401 && status !== 409) {
          throw error;
        }

        return null;
      })
  );

  const login = async ({ setErrors, setStatus, ...props }) => {
    setErrors([]);
    setStatus("loading");

    api
      .post("/cbt-student-login", props)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        mutate(res.data.user);
      })
      .catch((error) => {
        const status = error?.response?.status;

        if (status === 422) {
          setErrors(Object.values(error?.response?.data?.errors || {}).flat());
          return;
        }

        setErrors([getAxiosErrorMessage(error)]);
      })
      .finally(() => setStatus("idle"));
  };

  const logout = useCallback(() => {
    if (!error) {
      localStorage.removeItem("token");
      mutate(null);
    }

    window.location.pathname = "/";
  }, [error, mutate]);

  useEffect(() => {
    if (middleware == "guest" && redirectIfAuthenticated && user)
      router.push(redirectIfAuthenticated);
    if (middleware == "auth" && error) logout();
  }, [user, error, middleware, redirectIfAuthenticated, router, logout]);

  return {
    user,
    login,
    logout,
  };
};

export { api, useAuth };
