import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";

// Форма создания события используется и при редактировании, поэтому храним
// состояния отдельно

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
  const [editingEvent, setEditingEvent] = useState(null);

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

  const handleEditTagToggle = (tagId) => {
    setEditingEvent((prev) => {
      if (!prev) return prev;
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
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setEditingEvent({
      ...ev,
      start_date: ev.start_date.slice(0, 16),
      end_date: ev.end_date.slice(0, 16),
      tag_ids: ev.tags ? ev.tags.map((t) => t.id) : [],
    });
  };

  const handleUpdateEvent = async () => {
    const response = await fetch(`/events/${editingEvent.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        ...editingEvent,
        start_date: new Date(editingEvent.start_date).toISOString(),
        end_date: new Date(editingEvent.end_date).toISOString(),
      }),
    });

    if (response.ok) {
      alert("Событие обновлено!");
      setEditingEvent(null);
      loadEvents();
    } else {
      const err = await response.json();
      alert("Ошибка: " + err.detail);
    }
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
        <h2 className="text-xl font-bold">Создать событие</h2>
        <Input
          placeholder="Название"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
        />
        <Input
          placeholder="Тип"
          value={newEvent.type}
          onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
        />
        <Input
          type="datetime-local"
          placeholder="Начало"
          value={newEvent.start_date}
          onChange={(e) =>
            setNewEvent({ ...newEvent, start_date: e.target.value })
          }
        />
        <Input
          type="datetime-local"
          placeholder="Конец"
          value={newEvent.end_date}
          onChange={(e) =>
            setNewEvent({ ...newEvent, end_date: e.target.value })
          }
        />
        <Input
          placeholder="Описание"
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent({ ...newEvent, description: e.target.value })
          }
        />
        <Input
          placeholder="Image URL"
          value={newEvent.image_url}
          onChange={(e) =>
            setNewEvent({ ...newEvent, image_url: e.target.value })
          }
        />
        <Input
          placeholder="Source URL"
          value={newEvent.source_url}
          onChange={(e) =>
            setNewEvent({ ...newEvent, source_url: e.target.value })
          }
        />
        <div className="flex gap-2 flex-wrap">
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
        <Input
          placeholder="API Key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <Button onClick={handleCreateEvent}>Создать</Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold">Список событий</h2>
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{event.title}</div>
                <div className="text-sm">
                  {format(new Date(event.start_date), "yyyy-MM-dd")} -
                  {" "}
                  {format(new Date(event.end_date), "yyyy-MM-dd")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleEdit(event.id)}>Редактировать</Button>
                <Button onClick={() => handleDelete(event.id)}>Удалить</Button>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {editingEvent && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50">
          <Card className="bg-white p-4 space-y-2 w-96">
            <CardContent className="space-y-2">
              <h2 className="text-xl font-bold">Редактировать событие</h2>
              <Input
                placeholder="Название"
                value={editingEvent.title}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, title: e.target.value })
                }
              />
              <Input
                placeholder="Тип"
                value={editingEvent.type}
                onChange={(e) =>
                  setEditingEvent({ ...editingEvent, type: e.target.value })
                }
              />
              <Input
                type="datetime-local"
                placeholder="Начало"
                value={editingEvent.start_date}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    start_date: e.target.value,
                  })
                }
              />
              <Input
                type="datetime-local"
                placeholder="Конец"
                value={editingEvent.end_date}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    end_date: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Описание"
                value={editingEvent.description || ""}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    description: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Image URL"
                value={editingEvent.image_url || ""}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    image_url: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Source URL"
                value={editingEvent.source_url || ""}
                onChange={(e) =>
                  setEditingEvent({
                    ...editingEvent,
                    source_url: e.target.value,
                  })
                }
              />
              <div className="flex gap-2 flex-wrap">
                {allTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={editingEvent.tag_ids.includes(tag.id)}
                      onChange={() => handleEditTagToggle(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdateEvent}>Сохранить</Button>
                <Button onClick={() => setEditingEvent(null)}>Отмена</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
