import React, { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";
import Nav from "./Nav";

interface Option {
  value: number;
  label: string;
}

interface InputProps {
  label: string;
  subscript: string;
  options: Option[];
  onResultChange: (result: number) => void;
}

const InputWithDropdown: React.FC<InputProps> = ({
  label,
  subscript,
  options,
  onResultChange,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);
    const selectedOption = options.find(
      (option) => option.label === selectedValue
    );
    if (selectedOption) {
      const result = selectedOption.value;
      onResultChange(result);
    }
  };

  return (
    <div className="py-2 pb-4">
      <div className="text-xl">{label}</div>
      <div className="text-xs">{subscript}</div>
      <div>
        <select
          value={selectedOption || ""}
          onChange={handleOptionChange}
          className="form-select mt-1 block w-full rounded-md bg-gray-200 text-gray-800"
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

const ViableStartupCalculator: React.FC = () => {
  const [inputResults, setInputResults] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const screenshotRef = useRef(null);

  const handleScreenshotDownload = async () => {
    if (screenshotRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(screenshotRef.current);
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "screenshot.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Failed to download the screenshot:", error);
      }
    }
  };

  const handleInputResultChange = (index: number, result: number) => {
    setInputResults((prevResults) => {
      const newResults = [...prevResults];
      newResults[index] = result;
      return newResults;
    });
  };

  const calculateTotalResult = () => {
    return inputResults.reduce((total, result) => total * result, 1) / 625000;
  };

  const totalResult = calculateTotalResult();

  const calculateResult = (totalResult: number) => {
    if (totalResult >= 4) {
      return "Scale Up";
    } else if (totalResult >= 2) {
      return "Self-Fund";
    } else if (totalResult === 0) {
      return "TBD";
    } else {
      return "Not viable";
    }
  };

  const calculateResultColor = (totalResult: number) => {
    if (totalResult >= 4) {
      return "bg-green-400";
    } else if (totalResult >= 2) {
      return "bg-green-200";
    } else if (totalResult === 0) {
      return "bg-stone-200";
    } else {
      return "bg-red-400";
    }
  };

  let bgColorClass = calculateResultColor(totalResult);

  const optionsArray = [
    // Define the options for each InputWithDropdown here
    // Replace the following with your actual options
    {
      label: "Plausible",
      subscript: "Number of potential customers (consumers or businesses)",
      options: [
        { value: 1000000000, label: "1,000,000,000" },
        { value: 100000000, label: "100,000,000" },
        { value: 10000000, label: "10,000,000" },
        { value: 1000000, label: "1,000,000" },
        { value: 100000, label: "100,000" },
        { value: 10000, label: "10,000" },
        { value: 1000, label: "1,000" },
      ],
    },
    {
      label: "Self-Aware",
      subscript: "Willing to solve the problem",
      options: [
        { value: 0.01, label: "0.01: Few agree or care" },
        {
          value: 0.1,
          label: "0.1: Thought-leaders care/evangelize",
        },
        { value: 0.5, label: "0.5: Industry standard-practice" },
        {
          value: 1.0,
          label: "1.0: Hard to find someone who doesn’t care",
        },
      ],
    },
    {
      label: "Lucrative",
      subscript: "Annual allocated budget",
      options: [
        { value: 1000000, label: "$1,000,000" },
        { value: 100000, label: "$100,000" },
        { value: 10000, label: "$10,000" },
        { value: 1000, label: "$1,000" },
        { value: 100, label: "$100" },
        { value: 10, label: "$10" },
        { value: 1, label: "$1" },
      ],
    },
    {
      label: "Liquid",
      subscript: "Frequency of purchase decision",
      options: [
        { value: 0.01, label: "0.01: Every few years" },
        { value: 0.1, label: "0.1: An annual decision" },
        {
          value: 1.0,
          label: "1.0: Always in the market, easy to switch",
        },
      ],
    },
    {
      label: "Eager (identity)",
      subscript: "Attitude towards your company",
      options: [
        { value: 0, label: "0: They cannot buy from you" },
        { value: 0.1, label: "0.1: Structural/trust challenges" },
        { value: 0.5, label: "0.5: Indifferent" },
        { value: 1.0, label: "1.0: Emotional desire to select you" },
      ],
    },
    {
      label: "Eager (comparative)",
      subscript: "Competitive differentiation",
      options: [
        { value: 0.1, label: "0.1: No material differentiation" },
        { value: 0.5, label: "0.5: Some best-in-class features" },
        { value: 1.0, label: "1.0: No viable alternative" },
      ],
    },
    {
      label: "Enduring",
      subscript: "Will they still be here a year from now?",
      options: [
        {
          value: 0.01,
          label: "0.01: One-off purchase without loyalty",
        },
        { value: 0.1, label: "0.1 : One-off purchase with evangelism" },
        {
          value: 0.5,
          label: "0.5 : Recurring-revenue + recurring-problem",
        },
        { value: 1.0, label: "1.0 : Strong lock-in " },
      ],
    },
  ];

  return (
    <div>
      <Nav />
      <div className="min-h-screen flex items-center justify-center">
        <div
          className={`w-full max-w-xl mx-auto p-6 ${bgColorClass} mt-4 rounded-lg shadow-md`}
          ref={screenshotRef}
        >
          <h1 className="text-black text-5xl font-bold text-center mb-4">
            Is My Startup Viable?
          </h1>
          <div className="text-black font-bold text-center">
            Result: {calculateResult(totalResult)}
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-black">Name of startup</span>
              <input
                className="form-input mt-1 block w-full rounded-md bg-white-200 text-gray-800"
                type="text"
              />
            </label>
            <label className="block">
              <span className="text-black">Startup idea in one sentence</span>
              <input
                className="form-input mt-1 block w-full rounded-md bg-white-200 text-gray-800"
                type="text"
              />
            </label>
          </div>
          <div className="bg-slate-400 p-4 rounded-lg mt-4">
            {optionsArray.map((optionData, index) => (
              <InputWithDropdown
                key={index}
                label={optionData.label}
                subscript={optionData.subscript}
                options={optionData.options}
                onResultChange={(result) =>
                  handleInputResultChange(index, result)
                }
              />
            ))}
            <div className="text-black font-bold">Score: {totalResult}</div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded mt-4"
              onClick={handleScreenshotDownload}
            >
              Save Screenshot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViableStartupCalculator;
