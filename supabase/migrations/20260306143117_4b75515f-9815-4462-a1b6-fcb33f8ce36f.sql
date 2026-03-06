INSERT INTO time_slots (barber_id, day_of_week, slot_time, is_active)
SELECT 'c8214ae2-1185-40b0-b8a1-67208b7e4015', day_of_week, slot_time, is_active
FROM time_slots
WHERE barber_id = '7eb3ca29-a518-4c60-9e38-9bbf469d41c9';