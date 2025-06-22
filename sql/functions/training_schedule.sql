CREATE OR REPLACE VIEW training_schedule AS
SELECT training_session_date AS "Дата тренировки", 
	   training_session_start_time AS "Время начала", 
	   coach_full_name AS "ФИО тренера", 
	   hall.hall_id AS "Номер зала", 
	   CASE 
		    WHEN training_session_type = true THEN 'Групповая'
		    ELSE 'Индивидуальная'
	   END AS "Тип тренировки", 
	   training_session_duration AS "Длительность, мин.",
	   COUNT(trains.client_id) AS "Количество записанных",
	   training_session_max_members AS "Максимальное число участников"
FROM training_session 
JOIN coach ON coach.coach_id = training_session.coach_id 
JOIN hall ON hall.hall_id = training_session.hall_id 
LEFT JOIN trains ON trains.training_session_id = training_session.training_session_id
GROUP BY training_session_date, training_session_start_time,
	     coach_full_name, hall.hall_id, training_session_type, 
	     training_session_duration, training_session_max_members
ORDER BY training_session_date DESC;