export const preventNegativeKeys = (e, allowNegative = false) => {
  if (!allowNegative && (e.key === '-' || e.key === 'e')) {
    e.preventDefault();
  }
};

export const enforceNonNegative = (e) => {
  if (e.target.value !== '' && Number(e.target.value) < 0) {
    e.target.value = 0;
  }
};
