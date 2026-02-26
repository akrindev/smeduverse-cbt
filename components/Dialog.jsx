import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'

export default function Modal({ isOpen, setIsOpen, title, description, action }) {

  return (
    <>
      <Transition show={Boolean(isOpen)} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-50 overflow-y-auto"
          onClose={() => setIsOpen(false)}
        >
          <div className="fixed inset-0 z-40 bg-black opacity-80 filter backdrop-blur-lg" />
          <div className="relative z-50 min-h-screen px-3 text-center">

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className="inline-block w-full max-w-lg p-5 font-poppins my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-gray-900 text-center"
                >
                  {title}
                </Dialog.Title>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">
                    {description}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end space-x-2">
                  {action}
                  <button onClick={() => setIsOpen(false)} className="px-3 py-1 bg-gray-200 rounded border border-gray-300">tutup</button>
                </div>
              </div>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
