import { useEffect, useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { Check } from "lucide-react";

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
    if (isSaving) {
      return;
    }

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
                          <Check
                            size={16}
                            strokeWidth={1.5}
                            aria-hidden="true"
                          />
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
