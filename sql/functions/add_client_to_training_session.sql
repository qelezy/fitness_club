CREATE OR REPLACE PROCEDURE add_client_to_training_session(t_training_session_id INT, t_client_id INT)
LANGUAGE plpgsql AS $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM client
		WHERE client_id = t_client_id
	) THEN
		RAISE EXCEPTION 'Клиент с ID % не существует в базе', t_client_id;
	END IF;
	IF subscription_status OR subscription_start_date IS NULL
	FROM (
		SELECT subscription_status, subscription_start_date
		FROM subscription
		WHERE client_id = t_client_id
		ORDER BY subscription_start_date DESC
		LIMIT 1
	) THEN
		INSERT INTO trains (training_session_id, client_id)
        VALUES (t_training_session_id, t_client_id);
		RAISE NOTICE 'Клиент % успешно записан на тренировку %', t_client_id, t_training_session_id;
	ELSE
		RAISE EXCEPTION 'У клиента % нет активного абонемента', t_client_id;
	END IF;
END;
$$;