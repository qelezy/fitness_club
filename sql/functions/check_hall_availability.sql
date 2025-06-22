CREATE OR REPLACE FUNCTION check_hall_availability()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.training_session_type = TRUE AND EXISTS (
		SELECT 1
		FROM training_session
		WHERE training_session.hall_id = NEW.hall_id
		AND training_session_date = NEW.training_session_date
		AND training_session_type = TRUE
		AND (
			NEW.training_session_start_time 
			BETWEEN training_session_start_time
			AND training_session_start_time + INTERVAL '1 minute' * training_session_duration
			OR
			NEW.training_session_start_time + INTERVAL '1 minute' * NEW.training_session_duration
			BETWEEN training_session_start_time
			AND training_session_start_time + INTERVAL '1 minute' * training_session_duration
		)
	) THEN
		RAISE EXCEPTION 'Зал уже занят в указанное время';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_hall_availability
BEFORE INSERT ON training_session
FOR EACH ROW
EXECUTE FUNCTION check_hall_availability();