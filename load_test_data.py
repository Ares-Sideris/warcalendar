from datetime import datetime
from warcalendar_backend import SessionLocal, Base, engine, Event

# Ensure DB tables exist
Base.metadata.create_all(bind=engine)

events = [
    {
        "title": "День НОАК",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 1),
        "end_date": datetime(2023, 8, 1),
        "rewards": "Декаль, Доступная техника за ЗО",
        "country_tree": "Китай",
        "country_holiday": "Китай",
    },
    {
        "title": "День ВДВ РФ",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 2),
        "end_date": datetime(2023, 8, 2),
        "rewards": "Декаль",
        "country_tree": "Россия",
        "country_holiday": "Россия",
    },
    {
        "title": "Первый полет Lightning",
        "type": "Годовщина",
        "start_date": datetime(2023, 8, 4),
        "end_date": datetime(2023, 8, 4),
        "rewards": "Доступная техника за ЗО",
        "country_tree": "Великобритания",
        "country_holiday": None,
    },
    {
        "title": "День ВКС РФ",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 12),
        "end_date": datetime(2023, 8, 12),
        "rewards": "Декаль",
        "country_tree": "Россия",
        "country_holiday": "Россия",
    },
    {
        "title": "Первый полет Tornado",
        "type": "Годовщина",
        "start_date": datetime(2023, 8, 14),
        "end_date": datetime(2023, 8, 14),
        "rewards": "Декаль, Скидка на доступный набор из магазина",
        "country_tree": "Великобритания",
        "country_holiday": None,
    },
    {
        "title": "День ВС Польши",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 15),
        "end_date": datetime(2023, 8, 15),
        "rewards": "Декаль, Доступная техника за ЗО",
        "country_tree": "Польша",
        "country_holiday": "Польша",
    },
    {
        "title": "День ВДВ США",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 16),
        "end_date": datetime(2023, 8, 16),
        "rewards": "Декаль, Доступная техника за ЗО",
        "country_tree": "США",
        "country_holiday": "США",
    },
    {
        "title": "День освобождение Парижа",
        "type": "Праздник",
        "start_date": datetime(2023, 8, 19),
        "end_date": datetime(2023, 8, 19),
        "rewards": "Декаль",
        "country_tree": "Франция",
        "country_holiday": "Франция",
    },
    {
        "title": "Спуск на воду Prinz Eugen",
        "type": "Годовщина",
        "start_date": datetime(2023, 8, 22),
        "end_date": datetime(2023, 8, 22),
        "rewards": "Доступная техника за ЗО",
        "country_tree": "Германия",
        "country_holiday": None,
    },
    {
        "title": "Годовщина принятия МиГ-15 на вооружение",
        "type": "Годовщина",
        "start_date": datetime(2023, 8, 23),
        "end_date": datetime(2023, 8, 23),
        "rewards": "Доступная техника за ЗО",
        "country_tree": "СССР",
        "country_holiday": None,
    },
    {
        "title": "Завершение операции Багратион",
        "type": "Годовщина",
        "start_date": datetime(2023, 8, 29),
        "end_date": datetime(2023, 8, 29),
        "rewards": "Декаль, Специальный набор в магазине",
        "country_tree": "СССР",
        "country_holiday": None,
    },
]

session = SessionLocal()
for data in events:
    event = Event(**data)
    session.add(event)

session.commit()
session.close()
print("Loaded test data")
