import React, { useState } from "react";
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
  onOptionChange: (option: string) => void;
  selectedOption: string;
}

const InputWithDropdown: React.FC<InputProps> = ({
  label,
  subscript,
  options,
  onResultChange,
  onOptionChange,
  selectedOption,
}) => {
  const handleOptionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = event.target.value;
    onOptionChange(selectedValue);
    const selectedOption = options.find(
      (option) => option.label === selectedValue
    );
    if (selectedOption) {
      const result = selectedOption.value;
      onResultChange(result);
    }
  };

  return (
    <div className="py-2 pb-1">
      <div>{label}</div>
      <div className="text-[9px]">{subscript}</div>
      <div>
        <select
          value={selectedOption || ""}
          onChange={handleOptionChange}
          className="form-select mt-1 block w-full rounded-md bg-white-200 text-gray-800"
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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);

  const handleInputOptionChange = (index: number, option: string) => {
    setSelectedOptions((prevOptions) => {
      const newOptions = [...prevOptions];
      newOptions[index] = option;
      return newOptions;
    });
  };

  const exampleData = [
    // Replace this with your actual example data
    { result: 10000000, option: "10,000,000" },
    { result: 0.01, option: "0.01: Few agree or care" },
    { result: 10000, option: "$10,000" },
    { result: 0.01, option: "0.01: Every few years" },
    { result: 0.1, option: "0.1: Structural/trust challenges" },
    { result: 0.5, option: "0.5: Some best-in-class features" },
    { result: 0.1, option: "0.1 : One-off purchase with evangelism" },
  ];

  const handleFillExampleData = () => {
    const exampleResults = exampleData.map((data) => data.result);
    setInputResults(exampleResults);
    const exampleOptions = exampleData.map((data) => data.option);
    setSelectedOptions(exampleOptions);
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
          label: "1.0: Hard to find someone who doesn't care",
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
      <div className="min-h-min flex items-center justify-center px-2 mt-8">
        <div
          className={`w-full max-w-md mx-auto px-4 py-8 ${bgColorClass} rounded-lg shadow-md`}
        >
          <h1 className="text-black text-2xl font-bold text-center mb-4">
            Is My Startup Viable?
          </h1>
          <div className="flex justify-between items-center mt-2 px-4">
            <div className="text-black font-semibold text-sm">
              Score: {totalResult}
            </div>
            <div className="text-black font-semibold text-sm">
              Result: {calculateResult(totalResult)}
            </div>
          </div>
          <div className="flex items-center mt-2 px-4 text-xs text-black gap-4">
            <div>Examples:</div>
            <button
              className="border border-gray-300 p-1"
              onClick={handleFillExampleData}
            >
              WP Engine
            </button>
            <button
              className="border border-gray-300 p-1"
              onClick={handleFillExampleData}
            >
              WP Engine
            </button>
            <button
              className="border border-gray-300 p-1"
              onClick={handleFillExampleData}
            >
              WP Engine
            </button>
          </div>
          <div className="px-4 mt-6">
            <div className="bg-gray-300 h-0.5"></div>
          </div>
          <div className="px-4 rounded-lg mt-4">
            <div className="py-2 pb-1">
              <label className="block">
                <span className="text-black">Name of startup</span>
                <div className="text-[9px] pb-1">
                  Helpful for capturing the business in one word
                </div>
                <input
                  className="form-input block w-full rounded-md bg-white-200 text-black text-sm p-2 h-5"
                  type="text"
                />
              </label>
            </div>
            <div className="py-2 pb-1">
              <label className="block">
                <span className="text-black">Startup idea in one sentence</span>
                <div className="text-[9px] pb-1">
                  What would the "h1" tag on your main landing page say?
                </div>
                <input
                  className="form-input block w-full rounded-md bg-white-200 text-black text-sm p-2 h-5"
                  type="text"
                />
              </label>
            </div>
            {optionsArray.map((optionData, index) => (
              <InputWithDropdown
                key={index}
                label={optionData.label}
                subscript={optionData.subscript}
                options={optionData.options}
                onResultChange={(result) =>
                  handleInputResultChange(index, result)
                }
                onOptionChange={(option) =>
                  handleInputOptionChange(index, option)
                }
                selectedOption={selectedOptions[index]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViableStartupCalculator;
