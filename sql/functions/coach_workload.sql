CREATE OR REPLACE FUNCTION coach_workload(start_date DATE, end_date DATE)
RETURNS TABLE (
    "ФИО тренера" VARCHAR(256),
    "Количество тренировок" BIGINT,
    "Индивидуальные" BIGINT,
    "Групповые" BIGINT,
    "Общая длительность, мин." BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT coach_full_name,
    	        COUNT(training_session_id),
    	        COUNT(CASE WHEN training_session_type = false THEN 1 END),
        	        COUNT(CASE WHEN training_session_type = true THEN 1 END),
        	        SUM(training_session_duration)
    FROM coach
    JOIN training_session ON coach.coach_id = training_session.coach_id
    WHERE training_session_date BETWEEN start_date AND end_date
    GROUP BY coach_full_name;
END;
$$ LANGUAGE plpgsql;