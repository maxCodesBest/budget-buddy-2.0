import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./monthly-table.css";

type Category = {
  [subcategory: string]: number;
};

type ExpenseData = {
  year: number;
  month: number;
  categories: {
    [category: string]: Category;
  };
};

export const ExpenseTable = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1); // JS months are 0-based
  const [data, setData] = useState<ExpenseData | null>(null);
  const [caps, setCaps] = useState<
    Record<string, Record<string, number | null>>
  >({});
  const [selected, setSelected] = useState<{
    category: string;
    subcategory: string;
  } | null>(null);

  const monthValue = `${year}-${String(month).padStart(2, "0")}`;

  const CATEGORY_ORDER = [
    "Necessary",
    "Self Investment",
    "Luxuries",
    "Car",
    "General",
    "OneTime",
  ] as const;
  const CATEGORY_LABELS: Record<(typeof CATEGORY_ORDER)[number], string> = {
    Necessary: "Necessary",
    "Self Investment": "Self Investment",
    Luxuries: "Luxuries",
    Car: "Car",
    General: "General",
    OneTime: "One-time Expenses",
  };

  const PRESET_SUBCATEGORIES: Record<
    Exclude<(typeof CATEGORY_ORDER)[number], "OneTime">,
    string[]
  > = {
    Necessary: [
      "Rent",
      "Building maintenance",
      "Electricity",
      "Gas",
      "Water",
      "Arnona (municipal tax)",
      "Living groceries",
      "Health",
    ],
    "Self Investment": ["Cosmetics and haircuts", "Courses", "Books", "Sports"],
    Luxuries: [
      "Subscriptions",
      "Entertainment",
      "Wolt (food delivery)",
      "Impulse purchases",
      "Cigarettes and smoking",
      "Home improvements",
      "Electronics",
      "Clothing and footwear",
    ],
    Car: [
      "Maintenance",
      "Fines",
      "Insurance",
      "Gasoline",
      "Equipment",
      "Parking",
    ],
    General: ["Public transportation", "Psychologist", "Gifts"],
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  // Load persistent caps once (caps are global, not month-dependent)
  useEffect(() => {
    async function fetchCaps() {
      const pairs: Array<{
        category: keyof typeof PRESET_SUBCATEGORIES;
        sub: string;
      }> = [];
      (
        Object.keys(PRESET_SUBCATEGORIES) as Array<
          keyof typeof PRESET_SUBCATEGORIES
        >
      ).forEach((cat) => {
        PRESET_SUBCATEGORIES[cat].forEach((sub) =>
          pairs.push({ category: cat, sub })
        );
      });

      const results = await Promise.all(
        pairs.map(({ category, sub }) =>
          axios
            .get(
              `http://localhost:3000/expenses/spending-cap?category=${encodeURIComponent(
                String(category)
              )}&subCategory=${encodeURIComponent(sub)}`
            )
            .then((res) => ({ category, sub, value: res.data?.value }))
            .catch(() => ({ category, sub, value: null }))
        )
      );

      const next: Record<string, Record<string, number | null>> = {};
      (
        Object.keys(PRESET_SUBCATEGORIES) as Array<
          keyof typeof PRESET_SUBCATEGORIES
        >
      ).forEach((cat) => {
        next[cat] = {};
        PRESET_SUBCATEGORIES[cat].forEach((sub) => {
          const found = results.find(
            (r) => r.category === cat && r.sub === sub
          );
          next[cat][sub] =
            found?.value === null || found?.value === undefined
              ? null
              : Number(found.value);
        });
      });
      setCaps(next);
    }

    fetchCaps();
  }, []);

  const fetchData = async () => {
    const res = await axios.get(
      `http://localhost:3000/expenses?year=${year}&month=${month}`
    );
    const server = res.data?.value ?? res.data;

    const merged: ExpenseData = {
      year,
      month,
      categories: {
        Necessary: {},
        "Self Investment": {},
        Luxuries: {},
        Car: {},
        General: {},
        OneTime: server?.categories?.OneTime || {},
      },
    };

    (
      Object.keys(PRESET_SUBCATEGORIES) as Array<
        keyof typeof PRESET_SUBCATEGORIES
      >
    ).forEach((cat) => {
      PRESET_SUBCATEGORIES[cat].forEach((sub) => {
        const serverVal = server?.categories?.[cat]?.[sub];
        (merged.categories[cat] as Category)[sub] = Number(serverVal ?? 0);
      });
    });

    setData(merged);
  };

  const updateCell = (cat: string, sub: string, value: number) => {
    if (!data) return;
    setData({
      ...data,
      categories: {
        ...data.categories,
        [cat]: {
          ...data.categories[cat],
          [sub]: value,
        },
      },
    });
  };

  const incrementCell = (cat: string, sub: string, delta: number) => {
    if (!data) return;
    const current = Number((data.categories[cat] || {})[sub] ?? 0);
    updateCell(cat, sub, current + delta);
  };

  const renameOneTime = (oldKey: string, newNameRaw: string) => {
    if (!data) return;
    const newKey = newNameRaw.trim();
    if (!newKey || newKey === oldKey) return;

    const oneTime = { ...(data.categories.OneTime || {}) } as Category;
    const oldVal = Number(oneTime[oldKey] ?? 0);
    delete oneTime[oldKey];
    const mergedVal = Number(oneTime[newKey] ?? 0) + oldVal;
    oneTime[newKey] = mergedVal;

    setData({
      ...data,
      categories: {
        ...data.categories,
        OneTime: oneTime,
      },
    });

    if (selected?.category === "OneTime" && selected?.subcategory === oldKey) {
      setSelected({ category: "OneTime", subcategory: newKey });
    }
  };

  const addOneTimeRow = () => {
    if (!data) return;
    const newKey = `New item ${
      Object.keys(data.categories.OneTime || {}).length + 1
    }`;
    updateCell("OneTime", newKey, 0);
    setSelected({ category: "OneTime", subcategory: newKey });
  };

  const saveData = async () => {
    await axios.post("http://localhost:3000/expenses", data);
    setSelected(null);
    alert("Saved!");
  };

  const formatAmount = (num: number) =>
    Number(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const computeTotals = () => {
    if (!data)
      return { perCategory: {}, grand: 0 } as {
        perCategory: Record<string, number>;
        grand: number;
      };
    const perCategory: Record<string, number> = {};
    let grand = 0;
    Object.entries(data.categories).forEach(([cat, entries]) => {
      const sum = Object.values(entries || {}).reduce(
        (acc, v) => acc + Number(v || 0),
        0
      );
      perCategory[cat] = sum;
      grand += sum;
    });
    return { perCategory, grand };
  };

  const computeOverCaps = () => {
    if (!data)
      return [] as Array<{
        category: string;
        subCategory: string;
        amount: number;
        cap: number;
      }>;
    const items: Array<{
      category: string;
      subCategory: string;
      amount: number;
      cap: number;
    }> = [];
    (
      Object.keys(PRESET_SUBCATEGORIES) as Array<
        keyof typeof PRESET_SUBCATEGORIES
      >
    ).forEach((cat) => {
      PRESET_SUBCATEGORIES[cat].forEach((sub) => {
        const amount = Number((data.categories[cat] || {})[sub] ?? 0);
        const cap = caps?.[cat]?.[sub];
        if (cap !== null && cap !== undefined && amount > Number(cap)) {
          items.push({
            category: String(cat),
            subCategory: sub,
            amount,
            cap: Number(cap),
          });
        }
      });
    });
    return items;
  };

  return (
    <div className="expense-page">
      <header className="page-header">
        <h2>Monthly Expenses</h2>
        <div className="controls">
          <div className="control">
            <label htmlFor="month-picker">Month</label>
            <input
              id="month-picker"
              className="month-input"
              type="month"
              value={monthValue}
              onChange={(e) => {
                const val = e.target.value; // YYYY-MM
                const [yStr, mStr] = val.split("-");
                const y = Number(yStr);
                const m = Number(mStr);
                if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 1 && m <= 12) {
                  setYear(y);
                  setMonth(m);
                }
              }}
            />
          </div>
          <div className="control grow" />
          <button className="save-button" onClick={saveData}>
            💾 Save
          </button>
        </div>
      </header>

      <div className="page-content">
        <div className="categories-grid">
          {CATEGORY_ORDER.map((cat) => (
            <section className="category-card" key={cat}>
              <h3 className="category-title">{CATEGORY_LABELS[cat]}</h3>
              <table className="expense-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="amount-col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data?.categories?.[cat] || {}).map(
                    ([key, val]) => {
                      const isSelected =
                        selected?.category === cat &&
                        selected?.subcategory === key;
                      return (
                        <tr
                          key={key}
                          className={isSelected ? "selected" : undefined}
                          tabIndex={0}
                          onClick={() =>
                            setSelected({ category: cat, subcategory: key })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setSelected({ category: cat, subcategory: key });
                            }
                          }}
                        >
                          <td className="item-col">
                            {cat === "OneTime" ? (
                              <input
                                className="name-input"
                                type="text"
                                defaultValue={key}
                                placeholder="Label (e.g., Trip to Miami)"
                                onFocus={() =>
                                  setSelected({
                                    category: cat,
                                    subcategory: key,
                                  })
                                }
                                onBlur={(e) =>
                                  renameOneTime(key, e.currentTarget.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    renameOneTime(
                                      key,
                                      (e.target as HTMLInputElement).value
                                    );
                                  }
                                }}
                              />
                            ) : (
                              key
                            )}
                          </td>
                          <td>
                            <input
                              className="amount-input"
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              min={0}
                              value={val ?? 0}
                              onFocus={() =>
                                setSelected({ category: cat, subcategory: key })
                              }
                              onChange={(e) =>
                                updateCell(cat, key, parseFloat(e.target.value))
                              }
                            />
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
              {cat === "OneTime" && (
                <button className="add-row-button" onClick={addOneTimeRow}>
                  + Add item
                </button>
              )}
            </section>
          ))}
        </div>

        <Calculator
          enabled={!!selected}
          selectedLabel={
            selected ? `${selected.category} • ${selected.subcategory}` : ""
          }
          onSubmit={(amount) => {
            if (!selected) return;
            incrementCell(selected.category, selected.subcategory, amount);
          }}
        />
      </div>

      <Summary
        totals={computeTotals()}
        formatter={formatAmount}
        overCaps={computeOverCaps()}
      />
    </div>
  );
};

function Calculator(props: {
  enabled: boolean;
  selectedLabel: string;
  onSubmit: (amount: number) => void;
}) {
  const { enabled, selectedLabel, onSubmit } = props;
  const [value, setValue] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enabled && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [enabled, selectedLabel]);

  return (
    <aside className={`calculator ${enabled ? "enabled" : "disabled"}`}>
      <h3 className="category-title">Calculator</h3>
      <div className="calc-selected">
        {enabled ? selectedLabel : "Select a sub-category"}
      </div>
      <input
        className="calculator-input"
        type="text"
        inputMode="decimal"
        placeholder={enabled ? "Enter amount and press Enter" : "Disabled"}
        ref={inputRef}
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9.\-]/g, "");
          setValue(cleaned);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && enabled) {
            const num = parseFloat(value);
            if (!Number.isNaN(num)) {
              onSubmit(num);
              setValue("");
            }
          }
        }}
        disabled={!enabled}
      />
      <p className="calc-hint">Press Enter to add to the selected item</p>
    </aside>
  );
}

function Summary(props: {
  totals: { perCategory: Record<string, number>; grand: number };
  formatter: (n: number) => string;
  overCaps: Array<{
    category: string;
    subCategory: string;
    amount: number;
    cap: number;
  }>;
}) {
  const { totals, formatter, overCaps } = props;
  const ordered = [
    "Necessary",
    "Self Investment",
    "Luxuries",
    "Car",
    "General",
    "OneTime",
  ];
  const labels: Record<string, string> = {
    Necessary: "Necessary",
    "Self Investment": "Self Investment",
    Luxuries: "Luxuries",
    Car: "Car",
    General: "General",
    OneTime: "One-time Expenses",
  };
  return (
    <section className="summary-card">
      <h3 className="category-title">Summary</h3>
      <div className="summary-grid">
        {ordered.map((cat) => (
          <div className="summary-row" key={cat}>
            <span>{labels[cat]}</span>
            <strong>{formatter(totals.perCategory[cat] || 0)}</strong>
          </div>
        ))}
        <div className="summary-divider" />
        <div className="summary-row grand">
          <span>Total</span>
          <strong>{formatter(totals.grand)}</strong>
        </div>
        {overCaps.length > 0 && (
          <>
            <div className="summary-divider" />
            {overCaps.map((item) => (
              <div
                className="summary-row over-cap"
                key={`${item.category}:${item.subCategory}`}
              >
                <span>
                  {item.category} • {item.subCategory}
                </span>
                <strong title={`Cap: ${formatter(item.cap)}`}>
                  {formatter(item.amount)}
                </strong>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
