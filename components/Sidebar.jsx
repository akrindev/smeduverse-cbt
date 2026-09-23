import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Link2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import { loaderImg } from "../lib/loaderImg";

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();

  const { pathname } = router;

  const trigger = useRef(null);
  const sidebar = useRef(null);

  const storedSidebarExpanded = null;
  const [sidebarExpanded, setSidebarExpanded] = useState(
    storedSidebarExpanded === null ? false : storedSidebarExpanded === "true"
  );

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!sidebar.current || !trigger.current) return;
      if (
        !sidebarOpen ||
        sidebar.current.contains(target) ||
        trigger.current.contains(target)
      )
        return;
      // setSidebarOpen(false);
    };
    document.addEventListener("click", clickHandler);
    return () => document.removeEventListener("click", clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!sidebarOpen || keyCode !== 27) return;
      setSidebarOpen(false);
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  });

  useEffect(() => {
    if (sidebarExpanded) {
      document.querySelector("body").classList.add("sidebar-expanded");
    } else {
      document.querySelector("body").classList.remove("sidebar-expanded");
    }
  }, [sidebarExpanded]);

  return (
    <div>
      {/* Sidebar backdrop (mobile only) */}
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-30 z-40 lg:hidden lg:z-auto transition-opacity duration-200 ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden='true'></div>

      {/* Sidebar */}
      <div
        id='sidebar'
        ref={sidebar}
        className={`flex flex-col absolute z-40 left-0 top-0 lg:static lg:left-auto lg:top-auto lg:translate-x-0 transform h-screen overflow-y-scroll lg:overflow-y-auto no-scrollbar w-64 lg:w-20 lg:sidebar-expanded:!w-64 2xl:!w-64 flex-shrink-0 bg-gray-800 p-4 transition-all duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}>
        {/* Sidebar header */}
        <div className='flex justify-between mb-10 pr-3 sm:px-2'>
          {/* Close button */}
          <button
            ref={trigger}
            type='button'
            className='lg:hidden text-gray-500 hover:text-gray-400'
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-controls='sidebar'
            aria-expanded={sidebarOpen}>
            <span className='sr-only'>Tutup sidebar</span>
            <X size={24} strokeWidth={2} aria-hidden='true' />
          </button>
          <Image
            loader={loaderImg}
            src={`/assets/images/tutwurihandayani.png`}
            width={32}
            height={32}
            alt='tutwuri handayani'
            unoptimized={true}
          />
        </div>

        {/* Links */}
        <div className='space-y-8'>
          {/* Pages group */}
          <div>
            <h3 className='text-xs uppercase text-gray-500 font-semibold pl-3'>
              <span
                className='hidden lg:block lg:sidebar-expanded:hidden 2xl:hidden text-center w-6'
                aria-hidden='true'>
                •••
              </span>
              <span className='lg:hidden lg:sidebar-expanded:block 2xl:block'>
                Pages
              </span>
            </h3>
            <ul className='mt-3'>
              {/* Dashboard */}
              <li
                className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
                  pathname === "/dashboard" && "bg-gray-900"
                }`}>
                <Link
                  href={`/dashboard`}
                  className={`block text-gray-200 hover:text-white truncate transition duration-150 ${
                    pathname === "/" && "hover:text-gray-200"
                  }`}
                >
                  <div className='flex items-center'>
                      <LayoutDashboard
                        size={24}
                        strokeWidth={2}
                        className={`flex-shrink-0 text-gray-400 ${
                          pathname === "/dashboard" && "text-indigo-500"
                        }`}
                        aria-hidden="true"
                      />
                      <span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
                        Dashboard
                      </span>
                    </div>
                </Link>
              </li>
              {/* Ujian Susulan */}
              <li
                className={`px-3 py-2 rounded-sm mb-0.5 last:mb-0 ${
                  pathname === "/ujian-susulan" && "bg-gray-900"
                }`}>
                <Link
                  href={`/ujian-susulan`}
                  className={`block text-gray-200 hover:text-white truncate transition duration-150 ${
                    pathname === "/" && "hover:text-gray-200"
                  }`}
                >
                  <div className='flex items-center'>
                      <Link2
                        size={24}
                        strokeWidth={2}
                        className={`shrink-0 text-slate-600 ${
                          pathname === "/ujian-susulan" && "text-indigo-500"
                        }`}
                        aria-hidden="true"
                      />
                      <span className='text-sm font-medium ml-3 lg:opacity-0 lg:sidebar-expanded:opacity-100 2xl:opacity-100 duration-200'>
                        Ujian Susulan
                      </span>
                    </div>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Expand / collapse button */}
        <div className='pt-3 hidden lg:inline-flex 2xl:hidden justify-end mt-auto'>
          <div className='px-3 py-2'>
            <button
              type='button'
              onClick={() => setSidebarExpanded(!sidebarExpanded)}>
              <span className='sr-only'>
                {sidebarExpanded ? "Ciutkan sidebar" : "Perluas sidebar"}
              </span>
              {sidebarExpanded ? (
                <PanelLeftClose
                  size={24}
                  strokeWidth={2}
                  className='text-gray-400'
                  aria-hidden='true'
                />
              ) : (
                <PanelLeftOpen
                  size={24}
                  strokeWidth={2}
                  className='text-gray-400'
                  aria-hidden='true'
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
