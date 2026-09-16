import React from 'react';

const InputNumber = ({ min = 0, allowNegative = false, onKeyDown, onInput, onBlur, ...props }) => {
  const handleKeyDown = (e) => {
    if (!allowNegative && (e.key === '-' || e.key === 'e')) {
      e.preventDefault();
    }
    if (onKeyDown) onKeyDown(e);
  };

  const handleInput = (e) => {
    if (!allowNegative && e.target.value !== '' && Number(e.target.value) < 0) {
      e.target.value = 0;
    }
    if (onInput) onInput(e);
  };

  const handleBlur = (e) => {
    if (min !== undefined && min !== null && e.target.value !== '') {
      const numVal = Number(e.target.value);
      const minNum = Number(min);
      if (!isNaN(numVal) && !isNaN(minNum) && numVal < minNum) {
        e.target.value = minNum;
        if (props.onChange) {
          props.onChange(e);
        }
      }
    }
    if (onBlur) onBlur(e);
  };

  return (
    <input
      type="number"
      min={min}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onBlur={handleBlur}
      {...props}
    />
  );
};

export default InputNumber;
