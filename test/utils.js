export function noop() {
  return () => {};
}

export function plusOne(value) {
  return value + 1;
}

export function plusFive(value) {
  return value + 5;
}

export function iterator(list, transform) {
  return (value) => {
    const newValue = transform(value);
    list.push(newValue);
    return newValue;
  };
}
