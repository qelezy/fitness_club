CREATE OR REPLACE FUNCTION subscriptions_sales(start_date DATE, end_date DATE)
RETURNS TABLE (
    "ФИО клиента" VARCHAR(256),
    "Номер телефона" VARCHAR(24),
    "Срок действия, мес." SMALLINT,
    "Дата приобретения" DATE,
    "Дата начала действия" DATE,
	"Цена, руб." NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT client_full_name, client_phone_number, 
	   	   subscription_validity_period, subscription_purchase_date, 
	   	   subscription_start_date, subscription_price 
    FROM client JOIN subscription ON subscription.client_id = client.client_id 
    WHERE subscription_purchase_date BETWEEN start_date AND end_date
    UNION 
    SELECT NULL, NULL, NULL, NULL, NULL, SUM(subscription_price) 
    FROM client 
    JOIN subscription ON subscription.client_id = client.client_id 
    WHERE subscription_purchase_date BETWEEN start_date AND end_date
    ORDER BY client_full_name;
END;
$$ LANGUAGE plpgsql;