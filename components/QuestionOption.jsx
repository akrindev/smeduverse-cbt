import { useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'


export default function QuestionOption({ data: options, chosen, onChosen }) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSelected(chosen?.answer_chosen_id)
  }, [chosen])

  const handleChange = (value) => {
    setSelected(value)
    onChosen(value)
  }

  return (
    <div className="w-full py-5">
      <div className="w-full mx-auto">
        <RadioGroup value={selected} onChange={handleChange}>
          <RadioGroup.Label className="sr-only">Pilihan Jawaban</RadioGroup.Label>
          <div className="space-y-2">
            {options && options.map((option) => (
              <RadioGroup.Option
                key={option.id}
                value={option.id}
                className={({ active, checked }) =>
                  `${
                    active
                      ? 'ring-2 ring-offset-2 ring-offset-sky-300 ring-white ring-opacity-60'
                      : ''
                  }
                  ${
                    checked ? 'bg-green-600 text-white' : 'bg-white'
                  }
                    relative border border-lightBlue-100 rounded-lg px-3 py-2 cursor-pointer flex focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex items-center space-x-2 w-full">
                        {checked ? (
                        <div className="flex text-white justify-start">
                          <CheckIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex justify-start">
                          <span className="w-4 h-4 bg-gray-200 rounded-full"></span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <div className="text-sm">
                          <RadioGroup.Label
                            as="p"
                            className={`font-base  ${
                              checked ? 'text-white' : 'text-gray-900'
                            }`}
                            dangerouslySetInnerHTML={{ __html: option.answer }}
                          />
                        </div>
                      </div>
                      
                    </div>
                  </>
                )}
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
      <path
        d="M7 13l3 3 7-7"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
