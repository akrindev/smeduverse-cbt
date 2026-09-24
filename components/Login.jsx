/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Head from "next/head";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../lib/hooks/auth";
import { ThreeDots } from "./Loading";

export default function Login() {
  const { login, user } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/dashboard",
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState([]);
  const [status, setStatus] = useState(null);

  const submitForm = async (event) => {
    event.preventDefault();

    login({ email, password, setErrors, setStatus });
  };

  return (
    <>
      <Head>
        <title>CBT Login</title>
      </Head>
      <div className="container mx-auto px-4 h-full">
        <div className="flex content-center items-center justify-center h-full">
          <div className="w-full max-w-md px-4">
            <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-md bg-white border-0">
              <div className="rounded-t mb-0 px-6 py-6">
                <div className="text-center mb-3">
                  <div className="flex items-center justify-center">
                    <slot>
                      <img
                        src={"/assets/images/tutwurihandayani.png"}
                        alt="Tutwuri Handayani"
                        width={65}
                        height={65}
                      />
                    </slot>
                  </div>
                  <h6 className="text-blue-700 text-2xl font-poppins font-bold">
                    Computer Based Test
                  </h6>
                  <span className="text-sm text-lightBlue-600 font-nunito">
                    🎉 Sebelum masuk, identifikasi diri kamu dulu yuk
                  </span>
                </div>

                <hr className="mt-6 border-b-1 border-blueGray-300" />
              </div>
              {errors?.map((error) => (
                <div
                  key={error}
                  className="p-3 text-center bg-red-100 text-red-700 mb-3"
                >
                  {error}
                </div>
              ))}
              <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                <form onSubmit={submitForm}>
                  <div className="relative w-full mb-3">
                    <label
                      className="block uppercase text-zinc-600 text-xs font-bold mb-2"
                      htmlFor="grid-password"
                    >
                      NIS
                    </label>
                    <input
                      type="text"
                      className="px-3 py-3 placeholder-zinc-300 text-zinc-900 bg-zinc-100 rounded text-sm shadow focus:bg-blue-50 w-full"
                      placeholder="NIS"
                      // biome-ignore lint/a11y/noAutofocus: <explanation>
                      autoFocus
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="relative w-full mb-3">
                    <label
                      className="block uppercase text-zinc-600 text-xs font-bold mb-2"
                      htmlFor="grid-password"
                    >
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="px-3 py-3 placeholder-zinc-300 text-zinc-900 bg-zinc-100 rounded text-sm shadow focus:bg-blue-50 w-full pr-11"
                      placeholder="Password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                      aria-pressed={showPassword}
                      title={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          size={20}
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye size={20} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <div className="text-center mt-6">
                    <button
                      className={`
                                        flex items-center justify-center
                                        bg-sky-600 text-white hover:bg-sky-700 
                                        text-sm font-semibold px-6 py-3 
                                        rounded-md shadow-lg hover:shadow-lg outline-none focus:outline-none 
                                        mr-1 mb-1 w-full ease-linear transition-all duration-150 
                                        disabled:opacity-75`}
                      type="submit"
                      aria-label={status === "loading" ? "Memproses login" : undefined}
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? <ThreeDots /> : "Masuk"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap mb-10">
          <div className="w-full text-center text-xs md:text-sm opacity-70">
            <strong className="text-white font-bold">Smeducative</strong>{" "}
            <span className="text-white font-thin">
              is part of SMK Diponegoro Karanganyar
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
