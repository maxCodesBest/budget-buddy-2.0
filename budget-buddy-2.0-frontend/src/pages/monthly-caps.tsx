import { useEffect, useMemo, useState } from "react";
import { http } from "../lib/http";
import "./monthly-table.css";

type CapsMap = Record<string, Record<string, string>>; // category -> subcategory -> cap as string (for easy input handling)

const CATEGORY_ORDER = [
  "Necessary",
  "Self Investment",
  "Luxuries",
  "Car",
  "General",
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORY_ORDER)[number], string> = {
  Necessary: "Necessary",
  "Self Investment": "Self Investment",
  Luxuries: "Luxuries",
  Car: "Car",
  General: "General",
};

const PRESET_SUBCATEGORIES: Record<(typeof CATEGORY_ORDER)[number], string[]> =
  {
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

export function MonthlyCaps() {
  const [caps, setCaps] = useState<CapsMap>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const allPairs = useMemo(() => {
    const pairs: Array<{ category: string; subCategory: string }> = [];
    (CATEGORY_ORDER as readonly string[]).forEach((cat) => {
      PRESET_SUBCATEGORIES[cat as keyof typeof PRESET_SUBCATEGORIES].forEach(
        (sub) => pairs.push({ category: cat, subCategory: sub })
      );
    });
    return pairs;
  }, []);

  async function loadCaps() {
    setLoading(true);
    try {
      const results = await Promise.all(
        allPairs.map(({ category, subCategory }) =>
          http
            .get(
              `http://localhost:3000/expenses/spending-cap?category=${encodeURIComponent(
                category
              )}&subCategory=${encodeURIComponent(subCategory)}`
            )
            .then((res) => ({
              category,
              subCategory,
              value: res.data?.value,
            }))
            .catch(() => ({ category, subCategory, value: null }))
        )
      );

      const next: CapsMap = {};
      (CATEGORY_ORDER as readonly string[]).forEach((cat) => {
        next[cat] = {};
        PRESET_SUBCATEGORIES[cat as keyof typeof PRESET_SUBCATEGORIES].forEach(
          (sub) => {
            const found = results.find(
              (r) => r.category === cat && r.subCategory === sub
            );
            const val = found?.value;
            next[cat][sub] =
              val === null || val === undefined ? "" : String(val);
          }
        );
      });
      setCaps(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allPairs]);

  const setCapValue = (category: string, subCategory: string, raw: string) => {
    setCaps((prev) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [subCategory]: raw,
      },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const requests: Array<Promise<any>> = [];
      (CATEGORY_ORDER as readonly string[]).forEach((cat) => {
        PRESET_SUBCATEGORIES[cat as keyof typeof PRESET_SUBCATEGORIES].forEach(
          (sub) => {
            const strVal = caps?.[cat]?.[sub] ?? "";
            const num = parseFloat(strVal);
            if (!Number.isNaN(num) && num >= 0) {
              requests.push(
                http.post("http://localhost:3000/expenses/spending-cap", {
                  category: cat,
                  subCategory: sub,
                  cap: num,
                })
              );
            }
          }
        );
      });
      try {
        await Promise.all(requests);
      } catch (err) {
        console.error("Failed to save some caps", err);
        alert("Some caps failed to save. See console for details.");
      }
      await loadCaps();
      alert("Caps saved!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="expense-page">
      <header className="page-header">
        <h2>Monthly Caps</h2>
        <div className="controls">
          <div className="control grow" />
          <button
            className="save-button"
            onClick={saveAll}
            disabled={saving || loading}
          >
            {saving ? "Saving..." : "💾 Save caps"}
          </button>
        </div>
      </header>

      <div className="page-content">
        {loading ? (
          <p style={{ padding: 12 }}>Loading...</p>
        ) : (
          <div className="categories-grid">
            {(CATEGORY_ORDER as readonly string[]).map((cat) => (
              <section className="category-card" key={cat}>
                <h3 className="category-title">
                  {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]}
                </h3>
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Sub-category</th>
                      <th className="amount-col">Cap</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PRESET_SUBCATEGORIES[
                      cat as keyof typeof PRESET_SUBCATEGORIES
                    ].map((sub) => (
                      <tr key={sub}>
                        <td className="item-col">{sub}</td>
                        <td>
                          <input
                            className="amount-input"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            placeholder="No cap"
                            value={caps?.[cat]?.[sub] ?? ""}
                            onChange={(e) =>
                              setCapValue(cat, sub, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
