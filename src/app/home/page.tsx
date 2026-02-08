"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const NISHI_WASEDA = {
  name: "Nishi Waseda, Tokyo",
  lat: 35.7074,
  lon: 139.7016,
};

const TYPE_LABELS = {
  trip: "Trip",
  event: "Event",
  todo: "Todo",
  wishlist: "Wishlist",
} as const;

type ItemType = keyof typeof TYPE_LABELS;

type PlannerItem = {
  id: string;
  type: ItemType;
  title: string;
  date: string;
  fromDate?: string;
  toDate?: string;
  fromTime?: string;
  toTime?: string;
  location?: string;
  participants?: string;
  memo?: string;
  completed?: boolean;
};

type WeatherState = {
  temperature: number;
  code: number;
  time: string;
};

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatDateKey = (date: Date) => date.toISOString().split("T")[0];

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const isBeforeToday = (value: string) => {
  const date = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const isBetweenDates = (target: string, from?: string, to?: string) => {
  if (!from || !to) {
    return false;
  }
  const targetDate = parseDate(target);
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  return targetDate >= fromDate && targetDate <= toDate;
};

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const addMonths = (date: Date, offset: number) =>
  new Date(date.getFullYear(), date.getMonth() + offset, 1);

const getDaysInMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

const getTypePill = (type: ItemType) => {
  if (type === "trip") return "pill peach";
  if (type === "event") return "pill sky";
  if (type === "todo") return "pill mint";
  return "pill lavender";
};

const weatherIconForCode = (code: number) => {
  if ([0].includes(code)) return "☀️";
  if ([1, 2].includes(code)) return "🌤️";
  if ([3, 45, 48].includes(code)) return "☁️";
  if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "🌥️";
};

const weatherLabelForCode = (code: number) => {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if ([3].includes(code)) return "Cloudy";
  if ([45, 48].includes(code)) return "Foggy";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunder";
  return "Weather";
};

const isAutoCompleted = (item: PlannerItem) => {
  if (item.type === "trip") {
    return item.toDate ? isBeforeToday(item.toDate) : false;
  }
  if (item.type === "event") {
    if (item.date && isBeforeToday(item.date)) {
      return true;
    }
    if (item.date && item.toTime) {
      const now = new Date();
      const [hours, minutes] = item.toTime.split(":").map(Number);
      const end = parseDate(item.date);
      end.setHours(hours, minutes, 0, 0);
      return now > end;
    }
  }
  return false;
};

const itemOccursOnDate = (item: PlannerItem, dateKey: string) => {
  if (item.type === "trip") {
    return isBetweenDates(dateKey, item.fromDate, item.toDate);
  }
  if (item.type === "event") {
    return item.date === dateKey;
  }
  return item.date === dateKey;
};

const buildDefaultForm = (dateKey: string): PlannerItem => ({
  id: "",
  type: "trip",
  title: "",
  date: dateKey,
  fromDate: dateKey,
  toDate: dateKey,
  fromTime: "",
  toTime: "",
  location: "",
  participants: "",
  memo: "",
  completed: false,
});

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(getMonthStart(new Date()));
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [showMenu, setShowMenu] = useState(false);
  const [menuView, setMenuView] = useState<ItemType | "past" | "calendar">(
    "calendar"
  );
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PlannerItem | null>(null);
  const [formData, setFormData] = useState<PlannerItem>(() =>
    buildDefaultForm(formatDateKey(new Date()))
  );
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("asuka-planner-items");
    if (stored) {
      setItems(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("asuka-planner-items", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const loadWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${NISHI_WASEDA.lat}&longitude=${NISHI_WASEDA.lon}&current_weather=true&timezone=Asia%2FTokyo`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }
        const data = await response.json();
        if (!data.current_weather) {
          throw new Error("Weather unavailable");
        }
        setWeather({
          temperature: data.current_weather.temperature,
          code: data.current_weather.weathercode,
          time: data.current_weather.time,
        });
      } catch (error) {
        setWeatherError("Unable to load weather right now.");
      } finally {
        setWeatherLoading(false);
      }
    };

    loadWeather();
  }, []);

  const dateKey = formatDateKey(selectedDate);

  useEffect(() => {
    if (!editingItem) {
      setFormData(buildDefaultForm(dateKey));
    }
  }, [dateKey, editingItem]);

  const visibleItems = useMemo(
    () => items.filter((item) => itemOccursOnDate(item, dateKey)),
    [items, dateKey]
  );

  const pastItems = useMemo(
    () => items.filter((item) => isBeforeToday(item.date)),
    [items]
  );

  const menuItems = useMemo(() => {
    if (menuView === "past") {
      return pastItems;
    }
    if (menuView === "calendar") {
      return [];
    }
    return items.filter((item) => item.type === menuView);
  }, [items, menuView, pastItems]);

  const monthName = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = getDaysInMonth(month);
  const startDay = month.getDay();

  const handleSelectDate = (day: number) => {
    const newDate = new Date(month.getFullYear(), month.getMonth(), day);
    setSelectedDate(newDate);
    setMenuView("calendar");
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setMonth(getMonthStart(today));
    setMenuView("calendar");
  };

  const openNewForm = () => {
    setEditingItem(null);
    setFormData(buildDefaultForm(dateKey));
    setShowForm(true);
  };

  const handleEdit = (item: PlannerItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowForm(true);
  };

  const handleDelete = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleMenuNavigate = (view: ItemType | "past") => {
    setMenuView(view);
    setShowMenu(false);
  };

  const handleToggleComplete = (item: PlannerItem) => {
    if (item.type === "trip" || item.type === "event") {
      return;
    }
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, completed: !entry.completed }
          : entry
      )
    );
  };

  const handleFormChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ItemType;
    setFormData((prev) => ({
      ...prev,
      type: value,
      date: prev.date || dateKey,
      fromDate: value === "trip" ? prev.fromDate || dateKey : prev.fromDate,
      toDate: value === "trip" ? prev.toDate || dateKey : prev.toDate,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload: PlannerItem = {
      ...formData,
      id: editingItem?.id ?? createId(),
      date:
        formData.type === "wishlist"
          ? dateKey
          : formData.type === "trip"
          ? formData.fromDate || dateKey
          : formData.date || dateKey,
    };

    setItems((prev) => {
      if (editingItem) {
        return prev.map((item) => (item.id === editingItem.id ? payload : item));
      }
      return [payload, ...prev];
    });

    setShowForm(false);
    setEditingItem(null);
    setFormData(buildDefaultForm(dateKey));
  };

  return (
    <main className="page-shell">
      <header className="flex-between" style={{ marginBottom: 16 }}>
        <button className="icon-btn" onClick={() => setShowMenu(true)}>
          ☰
        </button>
        <div>
          <p className="small-text">Welcome back, Asuka</p>
          <h2 style={{ fontSize: "1.5rem" }}>Your cozy planner</h2>
        </div>
        <div className="icon-btn" title="Weather">
          <span role="img" aria-label="weather">
            {weather ? weatherIconForCode(weather.code) : "🌥️"}
          </span>
        </div>
      </header>

      <div
        className="card"
        style={{ display: "grid", gap: 12, marginBottom: 16 }}
      >
        <div className="flex-between">
          <div>
            <p className="small-text">Weather</p>
            <p style={{ fontWeight: 600 }}>{NISHI_WASEDA.name}</p>
            {weather && (
              <p className="small-text">
                {weatherLabelForCode(weather.code)} · updated{" "}
                {new Date(weather.time).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="pill sky">
            <span role="img" aria-label="weather">
              {weather ? weatherIconForCode(weather.code) : "🌥️"}
            </span>
            {weatherLoading && "Loading"}
            {!weatherLoading && weather && `${weather.temperature}°C`}
            {!weatherLoading && weatherError && "Offline"}
          </div>
        </div>
        {weatherError && <p className="small-text">{weatherError}</p>}
      </div>

      {menuView === "calendar" ? (
        <>
          <section className="card" style={{ display: "grid", gap: 14 }}>
            <div className="flex-between">
              <button
                className="icon-btn"
                onClick={() => setMonth(addMonths(month, -1))}
              >
                ←
              </button>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontWeight: 700 }}>{monthName}</p>
                <button className="secondary-btn" onClick={handleToday}>
                  Today
                </button>
              </div>
              <button
                className="icon-btn"
                onClick={() => setMonth(addMonths(month, 1))}
              >
                →
              </button>
            </div>

            <div className="calendar-grid" style={{ fontSize: "0.8rem" }}>
              {WEEKDAYS.map((day) => (
                <span key={day} className="small-text">
                  {day}
                </span>
              ))}
            </div>

            <div className="calendar-grid">
              {Array.from({ length: startDay }).map((_, index) => (
                <span key={`blank-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1;
                const date = new Date(month.getFullYear(), month.getMonth(), day);
                const key = formatDateKey(date);
                const isSelected = key === dateKey;
                const isToday = key === formatDateKey(new Date());
                const hasItems = items.some((item) => itemOccursOnDate(item, key));
                return (
                  <button
                    key={key}
                    className={`calendar-day ${
                      isSelected ? "selected" : ""
                    } ${isToday ? "today" : ""}`}
                    onClick={() => handleSelectDate(day)}
                  >
                    {day}
                    {hasItems && <span className="dot" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: 18, display: "grid", gap: 14 }}>
            <div className="flex-between">
              <h3>Plans for {selectedDate.toDateString()}</h3>
              <button className="primary-btn" onClick={openNewForm}>
                + Add
              </button>
            </div>

            {visibleItems.length === 0 ? (
              <div className="card small-text">
                No plans yet. Add a trip, event, todo, or wishlist ✨
              </div>
            ) : (
              visibleItems.map((item) => {
                const autoCompleted = isAutoCompleted(item);
                const completed =
                  item.type === "todo" || item.type === "wishlist"
                    ? item.completed
                    : autoCompleted;
                return (
                  <div
                    key={item.id}
                    className={`item-card ${completed ? "completed" : ""}`}
                    onClick={() => handleToggleComplete(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex-between">
                      <span className={getTypePill(item.type)}>
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span className="small-text">
                        {completed ? "Completed" : "Upcoming"}
                      </span>
                    </div>
                    <div>
                      <h4>{item.title || "Untitled"}</h4>
                      {item.memo && <p className="small-text">{item.memo}</p>}
                    </div>
                    <div className="tag-row">
                      {item.location && (
                        <span className="pill sky">📍 {item.location}</span>
                      )}
                      {item.participants && (
                        <span className="pill mint">👥 {item.participants}</span>
                      )}
                      {item.type === "trip" && (
                        <span className="pill peach">
                          {item.fromDate} → {item.toDate}
                        </span>
                      )}
                      {item.type === "event" && (
                        <span className="pill lavender">
                          {item.date} {item.fromTime}
                          {item.toTime ? ` → ${item.toTime}` : ""}
                        </span>
                      )}
                      {(item.type === "todo" || item.type === "wishlist") && (
                        <span className="pill lavender">{item.date}</span>
                      )}
                    </div>
                    <div className="item-actions">
                      <button
                        className="secondary-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </>
      ) : (
        <section className="card" style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <div className="flex-between">
            <div>
              <p className="small-text">Category</p>
              <h3>
                {menuView === "past"
                  ? "Past events"
                  : `${TYPE_LABELS[menuView]} list`}
              </h3>
            </div>
            <div className="flex" style={{ gap: 10 }}>
              <button
                className="secondary-btn"
                onClick={() => setMenuView("calendar")}
              >
                Back to calendar
              </button>
              <Link href="/">
                <button className="secondary-btn">Log out</button>
              </Link>
            </div>
          </div>
          {menuItems.length === 0 ? (
            <p className="small-text">Nothing here yet.</p>
          ) : (
            menuItems.map((item) => {
              const autoCompleted = isAutoCompleted(item);
              const completed =
                item.type === "todo" || item.type === "wishlist"
                  ? item.completed
                  : autoCompleted;
              return (
                <div
                  key={item.id}
                  className={`item-card ${completed ? "completed" : ""}`}
                  onClick={() => handleToggleComplete(item)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex-between">
                    <span className={getTypePill(item.type)}>
                      {TYPE_LABELS[item.type]}
                    </span>
                    <span className="small-text">
                      {completed ? "Completed" : "Upcoming"}
                    </span>
                  </div>
                  <div>
                    <h4>{item.title || "Untitled"}</h4>
                    {item.memo && <p className="small-text">{item.memo}</p>}
                  </div>
                  <div className="tag-row">
                    {item.location && (
                      <span className="pill sky">📍 {item.location}</span>
                    )}
                    {item.participants && (
                      <span className="pill mint">👥 {item.participants}</span>
                    )}
                    {item.type === "trip" && (
                      <span className="pill peach">
                        {item.fromDate} → {item.toDate}
                      </span>
                    )}
                    {item.type === "event" && (
                      <span className="pill lavender">
                        {item.date} {item.fromTime}
                        {item.toTime ? ` → ${item.toTime}` : ""}
                      </span>
                    )}
                    {(item.type === "todo" || item.type === "wishlist") && (
                      <span className="pill lavender">{item.date}</span>
                    )}
                  </div>
                  <div className="item-actions">
                    <button
                      className="secondary-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEdit(item);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      )}

      {showMenu && (
        <div className="menu-panel" onClick={() => setShowMenu(false)}>
          <div
            className="menu-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-between">
              <h3>Menu</h3>
              <button className="icon-btn" onClick={() => setShowMenu(false)}>
                ✕
              </button>
            </div>
            <button
              className="menu-item"
              onClick={() => handleMenuNavigate("trip")}
            >
              Trips <span>{items.filter((item) => item.type === "trip").length}</span>
            </button>
            <button
              className="menu-item"
              onClick={() => handleMenuNavigate("event")}
            >
              Events <span>{items.filter((item) => item.type === "event").length}</span>
            </button>
            <button
              className="menu-item"
              onClick={() => handleMenuNavigate("todo")}
            >
              Todos <span>{items.filter((item) => item.type === "todo").length}</span>
            </button>
            <button
              className="menu-item"
              onClick={() => handleMenuNavigate("wishlist")}
            >
              Wishlist <span>{items.filter((item) => item.type === "wishlist").length}</span>
            </button>
            <button
              className="menu-item"
              onClick={() => handleMenuNavigate("past")}
            >
              Past events <span>{pastItems.length}</span>
            </button>
            <Link href="/">
              <button className="secondary-btn">Log out</button>
            </Link>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <h3>{editingItem ? "Edit item" : "Add new"}</h3>
              <button className="icon-btn" onClick={() => setShowForm(false)}>
                ✕
              </button>
            </div>
            <form className="grid" onSubmit={handleSubmit}>
              <label style={{ display: "grid", gap: 8 }}>
                Type
                <select name="type" value={formData.type} onChange={handleTypeChange}>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ display: "grid", gap: 8 }}>
                Title
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Give it a cute name"
                  required
                />
              </label>

              {formData.type === "trip" && (
                <>
                  <label style={{ display: "grid", gap: 8 }}>
                    From date
                    <input
                      type="date"
                      name="fromDate"
                      value={formData.fromDate}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    To date
                    <input
                      type="date"
                      name="toDate"
                      value={formData.toDate}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                </>
              )}

              {formData.type === "event" && (
                <>
                  <label style={{ display: "grid", gap: 8 }}>
                    Date
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    From time
                    <input
                      type="time"
                      name="fromTime"
                      value={formData.fromTime}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                  <label style={{ display: "grid", gap: 8 }}>
                    To time (optional)
                    <input
                      type="time"
                      name="toTime"
                      value={formData.toTime}
                      onChange={handleFormChange}
                    />
                  </label>
                </>
              )}

              {formData.type === "todo" && (
                <label style={{ display: "grid", gap: 8 }}>
                  Date
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                  />
                </label>
              )}

              {formData.type !== "wishlist" && (
                <label style={{ display: "grid", gap: 8 }}>
                  Location
                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="Where is it?"
                  />
                </label>
              )}

              <label style={{ display: "grid", gap: 8 }}>
                Participants {formData.type === "wishlist" ? "(optional)" : ""}
                <input
                  name="participants"
                  value={formData.participants}
                  onChange={handleFormChange}
                  placeholder="Who is joining?"
                />
              </label>

              <label style={{ display: "grid", gap: 8 }}>
                Memo
                <textarea
                  name="memo"
                  value={formData.memo}
                  onChange={handleFormChange}
                  placeholder="Add a sweet reminder"
                />
              </label>

              <button className="primary-btn" type="submit">
                {editingItem ? "Save changes" : "Add item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
