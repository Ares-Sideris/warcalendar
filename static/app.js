async function loadTags() {
  const res = await fetch('/tags/');
  const tags = await res.json();
  const list = document.getElementById('tagList');
  const boxes = document.getElementById('tagCheckboxes');
  list.innerHTML = '';
  boxes.innerHTML = '';
  tags.forEach(tag => {
    const li = document.createElement('li');
    li.textContent = tag.name + ' ';
    const del = document.createElement('button');
    del.textContent = 'Удалить';
    del.onclick = () => deleteTag(tag.id);
    li.appendChild(del);
    list.appendChild(li);

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = tag.id;
    label.appendChild(checkbox);
    label.append(' ' + tag.name);
    boxes.appendChild(label);
  });
}

async function createTag() {
  const name = document.getElementById('newTag').value.trim();
  if (!name) return;
  const res = await fetch('/tags/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': document.getElementById('apiKey').value
    },
    body: JSON.stringify({ name })
  });
  if (res.ok) {
    document.getElementById('newTag').value = '';
    loadTags();
  } else {
    alert('Ошибка при создании тега');
  }
}

async function deleteTag(id) {
  const res = await fetch(`/tags/${id}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': document.getElementById('apiKey').value }
  });
  if (res.ok) loadTags();
  else alert('Ошибка при удалении тега');
}

function buildQuery() {
  const params = new URLSearchParams();
  const type = document.getElementById('filterType').value;
  const tag = document.getElementById('filterTag').value;
  const active = document.getElementById('filterActive').checked;
  if (type) params.append('type', type);
  if (tag) params.append('tag', tag);
  if (active) params.append('active', 'true');
  return params.toString();
}

async function loadEvents() {
  const res = await fetch('/events/?' + buildQuery());
  const events = await res.json();
  const list = document.getElementById('eventList');
  list.innerHTML = '';
  events.forEach(ev => {
    const li = document.createElement('li');
    li.textContent = `${ev.title} (${ev.start_date.slice(0,10)} - ${ev.end_date.slice(0,10)})`;
    const del = document.createElement('button');
    del.textContent = 'Удалить';
    del.onclick = () => deleteEvent(ev.id);
    li.appendChild(del);
    list.appendChild(li);
  });
}

async function createEvent() {
  const checkboxes = document.querySelectorAll('#tagCheckboxes input[type=checkbox]:checked');
  const tag_ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
  const body = {
    title: document.getElementById('evTitle').value,
    type: document.getElementById('evType').value,
    start_date: new Date(document.getElementById('evStart').value).toISOString(),
    end_date: new Date(document.getElementById('evEnd').value).toISOString(),
    description: document.getElementById('evDescription').value,
    image_url: document.getElementById('evImage').value,
    source_url: document.getElementById('evSource').value,
    tag_ids
  };
  const res = await fetch('/events/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': document.getElementById('apiKey').value
    },
    body: JSON.stringify(body)
  });
  if (res.ok) {
    document.getElementById('evTitle').value = '';
    document.getElementById('evType').value = '';
    document.getElementById('evStart').value = '';
    document.getElementById('evEnd').value = '';
    document.getElementById('evDescription').value = '';
    document.getElementById('evImage').value = '';
    document.getElementById('evSource').value = '';
    loadEvents();
  } else {
    alert('Ошибка при создании события');
  }
}

async function deleteEvent(id) {
  const res = await fetch(`/events/${id}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': document.getElementById('apiKey').value }
  });
  if (res.ok) loadEvents();
  else alert('Ошибка при удалении');
}

document.getElementById('applyFilters').onclick = loadEvents;
document.getElementById('createTag').onclick = createTag;
document.getElementById('createEvent').onclick = createEvent;

loadTags();
loadEvents();
