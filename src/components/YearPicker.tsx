interface Props {
  years: number[];
  value: number;
  onChange: (year: number) => void;
}

export function YearPicker({ years, value, onChange }: Props) {
  return (
    <div className="segmented" role="radiogroup" aria-label="Jahr wählen">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          role="radio"
          aria-checked={year === value}
          className="segmented__item"
          onClick={() => onChange(year)}
        >
          {year}
        </button>
      ))}
    </div>
  );
}
