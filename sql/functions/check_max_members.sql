CREATE OR REPLACE FUNCTION check_max_members()
RETURNS TRIGGER AS $$
DECLARE
	max_members INT;
	current_members INT;
BEGIN
	SELECT COALESCE(training_session_max_members, 1) INTO max_members
	FROM training_session
	WHERE training_session_id = NEW.training_session_id;
	SELECT COUNT(client_id) INTO current_members
	FROM trains
	WHERE training_session_id = NEW.training_session_id;
	IF current_members >= max_members THEN
		RAISE EXCEPTION 'Максимальное количество участников тренировки уже достигнуто';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_max_members
BEFORE INSERT ON trains
FOR EACH ROW
EXECUTE FUNCTION check_max_members();