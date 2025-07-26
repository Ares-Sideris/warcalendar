import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

export default function CalendarView() {
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const [apiKey, setApiKey] = useState("");
  const [allTags, setAllTags] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "",
    start_date: "",
    end_date: "",
    description: "",
    image_url: "",
    source_url: "",
    tag_ids: [],
  });

  const loadEvents = async () => {
    const params = new URLSearchParams();
    if (filterType) params.append("type", filterType);
    if (filterTag) params.append("tag", filterTag);
    if (activeOnly) params.append("active", "true");

    const response = await fetch(`/events/?${params.toString()}`);
    const data = await response.json();
    setEvents(data);
  };

  const loadTags = async () => {
    const response = await fetch("/tags/");
    const data = await response.json();
    setAllTags(data);
  };

  const handleTagToggle = (tagId) => {
    setNewEvent((prev) => {
      const exists = prev.tag_ids.includes(tagId);
      return {
        ...prev,
        tag_ids: exists
          ? prev.tag_ids.filter((id) => id !== tagId)
          : [...prev.tag_ids, tagId],
      };
    });
  };

  const handleCreateEvent = async () => {
    const response = await fetch("/events/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        ...newEvent,
        start_date: new Date(newEvent.start_date).toISOString(),
        end_date: new Date(newEvent.end_date).toISOString(),
      }),
    });

    if (response.ok) {
      alert("Событие добавлено!");
      setNewEvent({
        title: "",
        type: "",
        start_date: "",
        end_date: "",
        description: "",
        image_url: "",
        source_url: "",
        tag_ids: [],
      });
      loadEvents();
    } else {
      const err = await response.json();
      alert("Ошибка: " + err.detail);
    }
  };

  const handleEdit = (id) => {
    alert(`Редактировать событие ${id}`);
  };

  const handleDelete = async (id) => {
    const confirmed = confirm("Удалить это событие?");
    if (!confirmed) return;
    const response = await fetch(`/events/${id}`, {
      method: "DELETE",
      headers: {
        "X-API-Key": apiKey,
      },
    });
    if (response.ok) {
      alert("Удалено");
      loadEvents();
    } else {
      const err = await response.json();
      alert("Ошибка: " + err.detail);
    }
  };

  useEffect(() => {
    loadEvents();
    loadTags();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Тип события"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        />
        <Input
          placeholder="Тег"
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
        />
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
          />
          Только активные
        </label>
        <Button onClick={loadEvents}>Фильтровать</Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Календарь событий</h2>
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          locale="ru"
          events={events.map((event) => ({
            title: event.title,
            start: event.start_date,
            end: event.end_date,
            url: event.source_url || undefined,
          }))}
        />
      </div>
    </div>
  );
}
