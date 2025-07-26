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

      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-semibold">Добавить событие</h2>
          <Input
            placeholder="API ключ"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Input
            placeholder="Название"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, title: e.target.value }))
            }
          />
          <Input
            placeholder="Тип"
            value={newEvent.type}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, type: e.target.value }))
            }
          />
          <Input
            type="date"
            placeholder="Начало"
            value={newEvent.start_date}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, start_date: e.target.value }))
            }
          />
          <Input
            type="date"
            placeholder="Окончание"
            value={newEvent.end_date}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, end_date: e.target.value }))
            }
          />
          <Input
            placeholder="Описание"
            value={newEvent.description}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, description: e.target.value }))
            }
          />
          <Input
            placeholder="URL картинки"
            value={newEvent.image_url}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, image_url: e.target.value }))
            }
          />
          <Input
            placeholder="Источник"
            value={newEvent.source_url}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, source_url: e.target.value }))
            }
          />
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={newEvent.tag_ids.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
          <Button onClick={handleCreateEvent}>Создать</Button>
        </CardContent>
      </Card>

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

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Список событий</h2>
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm">
                  {format(new Date(event.start_date), "dd.MM.yyyy")} -
                  {" "}
                  {format(new Date(event.end_date), "dd.MM.yyyy")}
                </div>
              </div>
              <div className="space-x-2">
                <Button size="sm" onClick={() => handleEdit(event.id)}>
                  Редактировать
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(event.id)}
                >
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
