import { useEffect, useState } from "react";
import { RadioGroup } from "@headlessui/react";

export default function QuestionOption({
  data: options,
  chosen,
  onChosen,
  isSaving,
}) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(chosen?.answer_chosen_id ?? null);
  }, [chosen?.answer_chosen_id]);

  const handleChange = (value) => {
    setSelected(value);
    onChosen(value);
  };

  return (
    <div
      className="w-full py-5 select-none"
      style={{
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        userSelect: "none",
      }}
      data-exam-protected="true"
    >
      <div className="w-full mx-auto">
        <RadioGroup
          value={selected}
          onChange={handleChange}
          disabled={isSaving}
          className={isSaving ? "opacity-60" : "opacity-100"}
        >
          <RadioGroup.Label className="sr-only">
            Pilihan Jawaban
          </RadioGroup.Label>
          <div className="space-y-2">
            {options?.map((option) => (
              <RadioGroup.Option
                key={option.id}
                value={option.id}
                disabled={isSaving}
                className={({ active, checked }) =>
                  `${
                    active
                      ? "ring-2 ring-offset-2 ring-offset-sky-300 ring-white ring-opacity-60"
                      : ""
                  }
                  ${checked ? "bg-green-600 text-white" : "bg-white"}
                  ${
                    isSaving
                      ? "cursor-not-allowed bg-gray-200"
                      : "cursor-pointer"
                  }
                    relative border border-lightBlue-100 rounded-lg px-3 py-2 cursor-pointer flex focus:outline-none`
                }
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex items-start space-x-2 w-full">
                      {checked ? (
                        <div className="flex items-start text-white justify-start">
                          <CheckIcon className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex items-start justify-start">
                          <span className="w-4 h-4 bg-gray-200 rounded-full" />
                        </div>
                      )}
                      <div className="">
                        <div className="text-sm">
                          {/* jika terdapat audio maka tampilkan audio */}
                          {option.audio && (
                            <div
                              className={
                                "flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg"
                              }
                            >
                              {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
                              <audio controls>
                                <source
                                  src={option.audio.url}
                                  type="audio/mpeg"
                                />
                              </audio>
                            </div>
                          )}
                          <RadioGroup.Label
                            as="div"
                            className={`font-sm font-roboto break-words ${
                              checked ? "text-white" : "text-gray-900"
                            }`}
                            style={{
                              WebkitUserSelect: "none",
                              WebkitTouchCallout: "none",
                              userSelect: "none",
                            }}
                            // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
                            dangerouslySetInnerHTML={{
                              __html: option.answer,
                            }}
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
  );
}

function CheckIcon(props) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle: <explanation>
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
  );
}
