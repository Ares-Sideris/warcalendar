import os
import pytest
from fastapi.testclient import TestClient

import warcalendar_backend as backend

client = TestClient(backend.app)

@pytest.fixture(autouse=True)
def clean_db():
    backend.Base.metadata.drop_all(bind=backend.engine)
    backend.Base.metadata.create_all(bind=backend.engine)
    yield


def test_tags_endpoint():
    # Initially no tags
    response = client.get('/tags/')
    assert response.status_code == 200
    assert response.json() == []

    # Create tag with valid API key
    response = client.post('/tags/', json={'name': 'special'}, headers={'X-API-Key': backend.API_KEY})
    assert response.status_code == 200
    data = response.json()
    assert data['name'] == 'special'
    assert 'id' in data

    # List tags after creation
    response = client.get('/tags/')
    assert response.status_code == 200
    tags = response.json()
    assert len(tags) == 1
    assert tags[0]['name'] == 'special'

    # Invalid API key
    response = client.post('/tags/', json={'name': 'bad'}, headers={'X-API-Key': 'wrong'})
    assert response.status_code == 403


def test_events_endpoint():
    # Initially empty
    response = client.get('/events/')
    assert response.status_code == 200
    assert response.json() == []

    # Create tag first
    tag_resp = client.post('/tags/', json={'name': 'tag1'}, headers={'X-API-Key': backend.API_KEY})
    tag_id = tag_resp.json()['id']

    # Invalid API key for creating event
    response = client.post(
        '/events/',
        json={
            'title': 'Event 1',
            'type': 'type1',
            'start_date': '2023-01-01T00:00:00',
            'end_date': '2023-01-02T00:00:00',
            'rewards': 'Декаль',
            'country_tree': 'Testland',
            'country_holiday': 'Testland',
            'tag_ids': [tag_id],
        },
        headers={'X-API-Key': 'wrong'}
    )
    assert response.status_code == 403

    # Create event with proper API key
    response = client.post(
        '/events/',
        json={
            'title': 'Event 1',
            'type': 'type1',
            'start_date': '2023-01-01T00:00:00',
            'end_date': '2023-01-02T00:00:00',
            'rewards': 'Декаль',
            'country_tree': 'Testland',
            'country_holiday': 'Testland',
            'tag_ids': [tag_id],
        },
        headers={'X-API-Key': backend.API_KEY}
    )
    assert response.status_code == 200
    event = response.json()
    assert event['title'] == 'Event 1'
    assert event['tags'][0]['name'] == 'tag1'

    # List events
    response = client.get('/events/')
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1
    assert events[0]['title'] == 'Event 1'

    # Filter by reward
    response = client.get('/events/?reward=%D0%94%D0%B5%D0%BA%D0%B0%D0%BB%D1%8C')
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1

    # Filter by country
    response = client.get('/events/?country=Testland')
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1


def test_nonexistent_object():
    response = client.get('/events/999')
    assert response.status_code == 404
