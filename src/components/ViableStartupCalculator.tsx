import React, { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";

enum RadioValue {
  Option1 = "option1",
  Option2 = "option2",
  Option3 = "option3",
}

interface InputProps {
  label: string;
  onResultChange: (result: number) => void;
}

const InputWithRadioButtons: React.FC<InputProps> = ({
  label,
  onResultChange,
}) => {
  const [selectedOption, setSelectedOption] = useState<RadioValue | null>(null);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value as RadioValue);
    const result = calculateInputResult(event.target.value as RadioValue);
    onResultChange(result);
  };

  const calculateInputResult = (option: RadioValue) => {
    const optionValues = {
      [RadioValue.Option1]: 2,
      [RadioValue.Option2]: 3,
      [RadioValue.Option3]: 5,
    };

    return optionValues[option];
  };

  return (
    <div>
      <label>{label}</label>
      <div>
        <input
          type="radio"
          value={RadioValue.Option1}
          checked={selectedOption === RadioValue.Option1}
          onChange={handleOptionChange}
        />
        Option 1
      </div>
      <div>
        <input
          type="radio"
          value={RadioValue.Option2}
          checked={selectedOption === RadioValue.Option2}
          onChange={handleOptionChange}
        />
        Option 2
      </div>
      <div>
        <input
          type="radio"
          value={RadioValue.Option3}
          checked={selectedOption === RadioValue.Option3}
          onChange={handleOptionChange}
        />
        Option 3
      </div>
      <div>
        Result: {selectedOption ? calculateInputResult(selectedOption) : 0}
      </div>
    </div>
  );
};

const ViableStartupCalculator: React.FC = () => {
  const [inputResults, setInputResults] = useState<number[]>([0, 0, 0, 0]);
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
    return inputResults.reduce((total, result) => total * result, 1);
  };

  const totalResult = calculateTotalResult();

  return (
    <div
      className={`bg-${totalResult > 0 ? "blue" : "red"}-500 mt-100`}
      ref={screenshotRef}
    >
      <h1 className="text-red-500 text-8xl">TechvBlogs</h1>
      <label>
        Name of startup:
        <input type="text" />
      </label>
      <label>
        Startup idea in 1 sentence:
        <input type="text" />
      </label>
      <div className="bg-green-400">
        <InputWithRadioButtons
          label="Input 1:"
          onResultChange={(result) => handleInputResultChange(0, result)}
        />
        <InputWithRadioButtons
          label="Input 2:"
          onResultChange={(result) => handleInputResultChange(1, result)}
        />
        <InputWithRadioButtons
          label="Input 3:"
          onResultChange={(result) => handleInputResultChange(2, result)}
        />
        <InputWithRadioButtons
          label="Input 4:"
          onResultChange={(result) => handleInputResultChange(3, result)}
        />
        <div>Total Result: {totalResult}</div>
        <button onClick={handleScreenshotDownload}>Save Screenshot</button>
      </div>
    </div>
  );
};

export default ViableStartupCalculator;
