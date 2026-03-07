--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2026-03-07 17:42:11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 242 (class 1255 OID 17425)
-- Name: add_client_to_training_session(integer, integer); Type: PROCEDURE; Schema: public; Owner: postgres
--

CREATE PROCEDURE public.add_client_to_training_session(IN t_training_session_id integer, IN t_client_id integer)
    LANGUAGE plpgsql
    AS $$
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


ALTER PROCEDURE public.add_client_to_training_session(IN t_training_session_id integer, IN t_client_id integer) OWNER TO postgres;

--
-- TOC entry 234 (class 1255 OID 17417)
-- Name: check_hall_availability(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_hall_availability() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.check_hall_availability() OWNER TO postgres;

--
-- TOC entry 229 (class 1255 OID 17415)
-- Name: check_max_members(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_max_members() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.check_max_members() OWNER TO postgres;

--
-- TOC entry 243 (class 1255 OID 25621)
-- Name: coach_workload(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.coach_workload(start_date date, end_date date) RETURNS TABLE("ФИО тренера" character varying, "Количество тренировок" bigint, "Индивидуальные" bigint, "Групповые" bigint, "Общая длительность, мин." bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        coach_full_name,
        COUNT(training_session_id),
        COUNT(CASE WHEN training_session_type = false THEN 1 END),
        COUNT(CASE WHEN training_session_type = true THEN 1 END),
        SUM(training_session_duration)
    FROM coach
    JOIN training_session ON coach.coach_id = training_session.coach_id
    WHERE training_session_date BETWEEN start_date AND end_date
    GROUP BY coach_full_name;
END;
$$;


ALTER FUNCTION public.coach_workload(start_date date, end_date date) OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 25623)
-- Name: subscriptions_sales(date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.subscriptions_sales(start_date date, end_date date) RETURNS TABLE("ФИО клиента" character varying, "Номер телефона" character varying, "Срок действия, мес." smallint, "Дата приобретения" date, "Дата начала действия" date, "Цена, руб." numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.subscriptions_sales(start_date date, end_date date) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 17299)
-- Name: administrator; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administrator (
    administrator_id integer NOT NULL,
    administrator_full_name character varying(256) NOT NULL,
    administrator_phone_number character varying(24) NOT NULL,
    administrator_password character varying(256)
);


ALTER TABLE public.administrator OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 17298)
-- Name: administrator_administrator_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.administrator_administrator_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.administrator_administrator_id_seq OWNER TO postgres;

--
-- TOC entry 4931 (class 0 OID 0)
-- Dependencies: 215
-- Name: administrator_administrator_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.administrator_administrator_id_seq OWNED BY public.administrator.administrator_id;


--
-- TOC entry 218 (class 1259 OID 17307)
-- Name: client; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client (
    client_id integer NOT NULL,
    client_full_name character varying(256) NOT NULL,
    client_birthday date,
    client_phone_number character varying(24) NOT NULL,
    client_password character varying(256)
);


ALTER TABLE public.client OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 17306)
-- Name: client_client_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_client_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_client_id_seq OWNER TO postgres;

--
-- TOC entry 4932 (class 0 OID 0)
-- Dependencies: 217
-- Name: client_client_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_client_id_seq OWNED BY public.client.client_id;


--
-- TOC entry 220 (class 1259 OID 17315)
-- Name: coach; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coach (
    coach_id integer NOT NULL,
    coach_full_name character varying(256) NOT NULL,
    coach_phone_number character varying(24) NOT NULL,
    coach_specialization character varying(128) NOT NULL,
    coach_password character varying(256)
);


ALTER TABLE public.coach OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 17314)
-- Name: coach_coach_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coach_coach_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coach_coach_id_seq OWNER TO postgres;

--
-- TOC entry 4933 (class 0 OID 0)
-- Dependencies: 219
-- Name: coach_coach_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coach_coach_id_seq OWNED BY public.coach.coach_id;


--
-- TOC entry 222 (class 1259 OID 17324)
-- Name: hall; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hall (
    hall_id integer NOT NULL,
    hall_category smallint NOT NULL,
    CONSTRAINT ckc_hall_category_hall CHECK ((hall_category >= 1))
);


ALTER TABLE public.hall OWNER TO postgres;

--
-- TOC entry 4934 (class 0 OID 0)
-- Dependencies: 222
-- Name: COLUMN hall.hall_category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.hall.hall_category IS '1 - бассейн
2 - боевых искусств
3 - тренажерный
4 - танцевальный
5 - йоги
6 - аэробики';


--
-- TOC entry 221 (class 1259 OID 17323)
-- Name: hall_hall_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hall_hall_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hall_hall_id_seq OWNER TO postgres;

--
-- TOC entry 4935 (class 0 OID 0)
-- Dependencies: 221
-- Name: hall_hall_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hall_hall_id_seq OWNED BY public.hall.hall_id;


--
-- TOC entry 224 (class 1259 OID 17333)
-- Name: subscription; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscription (
    subscription_id integer NOT NULL,
    client_id integer NOT NULL,
    subscription_purchase_date date NOT NULL,
    subscription_start_date date,
    subscription_validity_period smallint NOT NULL,
    subscription_status boolean NOT NULL,
    subscription_price numeric(5,0) NOT NULL
);


ALTER TABLE public.subscription OWNER TO postgres;

--
-- TOC entry 4936 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN subscription.subscription_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.subscription.subscription_status IS '0 - истек/неактивен
1 - активен';


--
-- TOC entry 223 (class 1259 OID 17332)
-- Name: subscription_subscription_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscription_subscription_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscription_subscription_id_seq OWNER TO postgres;

--
-- TOC entry 4937 (class 0 OID 0)
-- Dependencies: 223
-- Name: subscription_subscription_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscription_subscription_id_seq OWNED BY public.subscription.subscription_id;


--
-- TOC entry 226 (class 1259 OID 17342)
-- Name: training_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_session (
    training_session_id integer NOT NULL,
    hall_id integer NOT NULL,
    administrator_id integer NOT NULL,
    coach_id integer NOT NULL,
    training_session_date date NOT NULL,
    training_session_start_time time without time zone NOT NULL,
    training_session_duration smallint NOT NULL,
    training_session_type boolean NOT NULL,
    training_session_max_members smallint
);


ALTER TABLE public.training_session OWNER TO postgres;

--
-- TOC entry 4938 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN training_session.training_session_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.training_session.training_session_type IS '0 - индивидуальная
1 - групповая';


--
-- TOC entry 227 (class 1259 OID 17352)
-- Name: trains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trains (
    training_session_id integer NOT NULL,
    client_id integer NOT NULL
);


ALTER TABLE public.trains OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 25629)
-- Name: training_schedule; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.training_schedule AS
 SELECT training_session.training_session_date AS "Дата тренировки",
    training_session.training_session_start_time AS "Время начала",
    coach.coach_full_name AS "ФИО тренера",
    hall.hall_id AS "Номер зала",
        CASE
            WHEN (training_session.training_session_type = true) THEN 'Групповая'::text
            ELSE 'Индивидуальная'::text
        END AS "Тип тренировки",
    training_session.training_session_duration AS "Длительность, мин.",
    count(trains.client_id) AS "Количество записанных",
    training_session.training_session_max_members AS "Максимальное число участников"
   FROM (((public.training_session
     JOIN public.coach ON ((coach.coach_id = training_session.coach_id)))
     JOIN public.hall ON ((hall.hall_id = training_session.hall_id)))
     LEFT JOIN public.trains ON ((trains.training_session_id = training_session.training_session_id)))
  GROUP BY training_session.training_session_date, training_session.training_session_start_time, coach.coach_full_name, hall.hall_id, training_session.training_session_type, training_session.training_session_duration, training_session.training_session_max_members
  ORDER BY training_session.training_session_date DESC;


ALTER VIEW public.training_schedule OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17341)
-- Name: training_session_training_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.training_session_training_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.training_session_training_session_id_seq OWNER TO postgres;

--
-- TOC entry 4939 (class 0 OID 0)
-- Dependencies: 225
-- Name: training_session_training_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.training_session_training_session_id_seq OWNED BY public.training_session.training_session_id;


--
-- TOC entry 4726 (class 2604 OID 17302)
-- Name: administrator administrator_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrator ALTER COLUMN administrator_id SET DEFAULT nextval('public.administrator_administrator_id_seq'::regclass);


--
-- TOC entry 4727 (class 2604 OID 17310)
-- Name: client client_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client ALTER COLUMN client_id SET DEFAULT nextval('public.client_client_id_seq'::regclass);


--
-- TOC entry 4728 (class 2604 OID 17318)
-- Name: coach coach_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coach ALTER COLUMN coach_id SET DEFAULT nextval('public.coach_coach_id_seq'::regclass);


--
-- TOC entry 4729 (class 2604 OID 17327)
-- Name: hall hall_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hall ALTER COLUMN hall_id SET DEFAULT nextval('public.hall_hall_id_seq'::regclass);


--
-- TOC entry 4730 (class 2604 OID 17336)
-- Name: subscription subscription_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription ALTER COLUMN subscription_id SET DEFAULT nextval('public.subscription_subscription_id_seq'::regclass);


--
-- TOC entry 4731 (class 2604 OID 17345)
-- Name: training_session training_session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session ALTER COLUMN training_session_id SET DEFAULT nextval('public.training_session_training_session_id_seq'::regclass);


--
-- TOC entry 4914 (class 0 OID 17299)
-- Dependencies: 216
-- Data for Name: administrator; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.administrator VALUES (2, 'Князева Александра Юрьевна', '8(900)801-54-53', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.administrator VALUES (3, 'Кузнецова Дарья Сергеевна', '8(911)470-78-18', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.administrator VALUES (4, 'Салова Анастасия Петровна', '8(989)373-22-37', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.administrator VALUES (5, 'Кириенко Пётр Андреевич', '8(910)854-84-23', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.administrator VALUES (1, 'Маяков Егор Егорович', '8(950)803-94-92', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');


--
-- TOC entry 4916 (class 0 OID 17307)
-- Dependencies: 218
-- Data for Name: client; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.client VALUES (30, 'Добрынин Андрей Александрович', '2008-06-10', '8(900)879-09-90', '$2b$10$eUPBo3z5a8SGiMo0DCIs1.FsCPcfAziBYjqCjO8GYkH3b4pUI19Ie');
INSERT INTO public.client VALUES (1, 'Добрынин Сергей Александрович', '2004-12-27', '8(900)989-03-15', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (2, 'Шуравин Сергей Владимирович', '1994-06-16', '8(910)970-76-70', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (3, 'Шлыков Никита Андреевич', '1998-02-01', '8(900)626-64-58', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (4, 'Глебов Николай Алексеевич', '1988-04-12', '8(951)126-14-71', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (6, 'Соколов Роман Николаевич', '2004-05-05', '8(950)282-83-28', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (7, 'Абрамов Максим Алексеевич', '2004-06-13', '8(910)932-22-31', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (8, 'Лисицына Виктория Игоревна', '2001-08-25', '8(969)272-14-67', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (9, 'Тимошина Дарья Андреевна', '2000-07-21', '8(961)129-28-28', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (10, 'Смольянинова Марина Сергеевна', '2004-11-17', '8(911)470-78-18', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (11, 'Хорошилов Сергей Алексеевич', '1986-01-10', '8(950)332-53-36', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (12, 'Буркова Алина Юрьевна', '1996-03-27', '8(965)139-32-92', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (13, 'Фёдорова Анна Петровна', '1998-04-15', '8(900)237-33-44', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (14, 'Мананников Антон Олегович', '2004-08-14', '8(900)573-24-77', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (15, 'Камынина Валерия Андреевна', '2002-09-24', '8(951)303-42-32', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (16, 'Шевкунов Роман Сергеевич', '2004-02-06', '8(951)880-18-75', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (18, 'Щекланов Максим Николаевич', '1995-09-14', '8(900)882-82-25', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (20, 'Долгова Варвара Александровна', '2000-05-22', '8(911)570-49-02', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (21, 'Косенкова Елизавета Юрьевна', '2004-07-30', '8(903)562-81-34', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (22, 'Петров Борис Алексеевич', '1987-08-21', '8(910)845-53-08', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (23, 'Зайцева Ирина Сергеевна', '1991-03-19', '8(903)562-81-34', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (24, 'Бобровский Артём Олегович', '2003-12-27', '8(900)470-23-64', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (25, 'Дерябин Александр Александрович', '2004-05-30', '8(908)227-83-31', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (5, 'Зибров Иван Сергеевич', NULL, '8(989)100-25-47', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (17, 'Дунина Наталья Алексеевна', NULL, '8(950)919-23-28', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.client VALUES (19, 'Подлесных Роман Максимович', NULL, '8(916)453-43-46', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');


--
-- TOC entry 4918 (class 0 OID 17315)
-- Dependencies: 220
-- Data for Name: coach; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.coach VALUES (1, 'Новикова Елена Петровна', '8(950)882-27-27', 'Йога', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (2, 'Прядильникова Надежда Алексеевна', '8(911)531-11-65', 'Дзюдо', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (3, 'Кириков Дмитрий Александрович', '8(904)784-13-98', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (4, 'Зиброва Наталья Алексеевна', '8(965)286-45-87', 'Аэробика', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (5, 'Куликова Ксения Александровна', '8(951)410-34-05', 'Йога', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (6, 'Жаглина Татьяна Владимировна', '8(958)747-17-23', 'Плавание', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (7, 'Михайлова Ольга Вячеславовна', '8(950)193-65-49', 'Плавание', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (8, 'Потапова Татьяна Васильевна', '8(900)989-06-20', 'Дзюдо', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (9, 'Федяинов Игорь Петрович', '8(910)322-19-07', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (10, 'Колесникова Любовь Михайловна', '8(950)689-90-09', 'Йога', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (11, 'Сиделёва Светлана Викторовна', '8(914)526-12-74', 'Бальные танцы', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (12, 'Львов Евгений Александрович', '8(900)892-45-81', 'Карате', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (13, 'Смирнов Александр Сергеевич', '8(950)882-29-31', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (14, 'Иванов Николай Александрович', '8(900)377-32-05', 'Карате', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (15, 'Белов Михаил Алексеевич', '8(951)701-74-00', 'Бокс', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (16, 'Захаров Борис Дмитриевич', '8(991)279-19-19', 'Плавание', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (17, 'Савельев Виктор Николаевич', '8(965)139-32-82', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (18, 'Титова Марина Александровна', '8(991)489-10-14', 'Аэробика', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (19, 'Данилов Юрий Петрович', '8(900)295-03-06', 'Бокс', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (20, 'Орехов Владимир Александрович', '8(910)812-08-23', 'Айкидо', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (21, 'Семенюк Владимир Сергеевич', '8(914)677-26-27', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (22, 'Васильев Виктор Сергеевич', '8(950)521-42-12', 'Айкидо', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (23, 'Соколова Екатерина Владимировна', '8(911)850-02-92', 'Бальные танцы', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (24, 'Тарасов Максим Владимирович', '8(969)820-90-76', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');
INSERT INTO public.coach VALUES (25, 'Иванов Николай Петрович', '8(950)844-33-22', 'Бодибилдинг', '$2b$10$okTBk3WbNJrrPKFepEXRM.2.WYpnlbgjAlIACsp/8SmuNY8IeFKqe');


--
-- TOC entry 4920 (class 0 OID 17324)
-- Dependencies: 222
-- Data for Name: hall; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.hall VALUES (1, 1);
INSERT INTO public.hall VALUES (2, 2);
INSERT INTO public.hall VALUES (3, 2);
INSERT INTO public.hall VALUES (4, 3);
INSERT INTO public.hall VALUES (5, 3);
INSERT INTO public.hall VALUES (6, 3);
INSERT INTO public.hall VALUES (7, 4);
INSERT INTO public.hall VALUES (8, 4);
INSERT INTO public.hall VALUES (9, 5);
INSERT INTO public.hall VALUES (10, 6);


--
-- TOC entry 4922 (class 0 OID 17333)
-- Dependencies: 224
-- Data for Name: subscription; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.subscription VALUES (4, 3, '2024-05-22', '2024-05-30', 3, false, 5000);
INSERT INTO public.subscription VALUES (5, 11, '2023-09-30', '2023-10-04', 6, false, 10000);
INSERT INTO public.subscription VALUES (6, 6, '2023-02-10', '2023-02-17', 12, false, 18000);
INSERT INTO public.subscription VALUES (7, 7, '2023-01-23', '2023-01-28', 3, false, 5000);
INSERT INTO public.subscription VALUES (8, 5, '2024-08-13', '2024-08-20', 1, false, 2000);
INSERT INTO public.subscription VALUES (10, 2, '2022-07-19', '2022-07-26', 3, false, 5000);
INSERT INTO public.subscription VALUES (12, 8, '2022-03-17', '2022-03-23', 3, false, 5000);
INSERT INTO public.subscription VALUES (13, 24, '2024-05-27', '2024-06-02', 1, false, 2000);
INSERT INTO public.subscription VALUES (14, 9, '2024-04-11', '2024-04-18', 3, false, 5000);
INSERT INTO public.subscription VALUES (16, 14, '2022-12-03', '2022-12-09', 3, false, 5000);
INSERT INTO public.subscription VALUES (17, 18, '2023-06-14', '2023-06-22', 3, false, 5000);
INSERT INTO public.subscription VALUES (18, 19, '2024-03-09', '2024-03-14', 1, false, 2000);
INSERT INTO public.subscription VALUES (20, 21, '2024-08-14', '2024-08-19', 3, false, 5000);
INSERT INTO public.subscription VALUES (22, 15, '2023-02-19', '2023-02-23', 3, false, 5000);
INSERT INTO public.subscription VALUES (24, 10, '2023-07-03', '2023-07-11', 6, false, 10000);
INSERT INTO public.subscription VALUES (19, 13, '2022-11-26', '2022-11-28', 3, false, 5000);
INSERT INTO public.subscription VALUES (2, 17, '2022-11-15', '2022-11-25', 1, false, 2000);
INSERT INTO public.subscription VALUES (11, 25, '2022-06-26', '2022-06-30', 3, false, 2000);
INSERT INTO public.subscription VALUES (27, 1, '2025-06-11', NULL, 3, false, 5000);
INSERT INTO public.subscription VALUES (28, 1, '2025-06-11', NULL, 6, false, 10000);
INSERT INTO public.subscription VALUES (9, 4, '2025-05-26', NULL, 6, false, 2000);
INSERT INTO public.subscription VALUES (21, 16, '2025-05-23', NULL, 1, false, 2000);
INSERT INTO public.subscription VALUES (25, 25, '2025-05-27', NULL, 3, false, 5000);
INSERT INTO public.subscription VALUES (26, 20, '2025-05-28', NULL, 3, false, 5000);
INSERT INTO public.subscription VALUES (1, 1, '2025-05-14', '2025-05-18', 3, true, 5000);
INSERT INTO public.subscription VALUES (23, 12, '2024-07-23', '2024-07-27', 12, true, 18000);
INSERT INTO public.subscription VALUES (15, 23, '2025-02-05', '2025-02-10', 6, true, 10000);
INSERT INTO public.subscription VALUES (3, 22, '2025-04-20', '2025-04-28', 3, true, 5000);


--
-- TOC entry 4924 (class 0 OID 17342)
-- Dependencies: 226
-- Data for Name: training_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.training_session VALUES (1, 1, 2, 6, '2024-11-28', '10:00:00', 90, true, 20);
INSERT INTO public.training_session VALUES (3, 2, 3, 2, '2022-11-29', '15:00:00', 120, true, 16);
INSERT INTO public.training_session VALUES (4, 1, 1, 7, '2024-05-30', '14:30:00', 90, true, 20);
INSERT INTO public.training_session VALUES (5, 9, 1, 1, '2023-10-04', '13:00:00', 60, true, 25);
INSERT INTO public.training_session VALUES (6, 6, 3, 9, '2023-02-17', '11:00:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (7, 8, 2, 23, '2023-01-28', '10:00:00', 60, true, 20);
INSERT INTO public.training_session VALUES (8, 3, 5, 8, '2024-08-20', '09:30:00', 90, true, 16);
INSERT INTO public.training_session VALUES (9, 1, 4, 7, '2022-07-26', '16:00:00', 90, true, 25);
INSERT INTO public.training_session VALUES (10, 5, 4, 3, '2022-06-30', '16:30:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (11, 10, 3, 4, '2022-03-23', '14:30:00', 60, true, 25);
INSERT INTO public.training_session VALUES (12, 2, 1, 14, '2024-06-02', '11:00:00', 90, true, 16);
INSERT INTO public.training_session VALUES (13, 2, 1, 12, '2024-04-18', '13:30:00', 120, true, 16);
INSERT INTO public.training_session VALUES (14, 1, 2, 16, '2024-10-10', '10:30:00', 90, true, 20);
INSERT INTO public.training_session VALUES (15, 5, 3, 24, '2022-12-09', '10:00:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (16, 4, 4, 25, '2023-06-22', '09:30:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (17, 8, 5, 11, '2024-03-14', '14:30:00', 60, true, 20);
INSERT INTO public.training_session VALUES (18, 3, 2, 15, '2022-11-28', '14:00:00', 90, true, 16);
INSERT INTO public.training_session VALUES (20, 4, 4, 3, '2023-02-23', '11:00:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (22, 4, 2, 13, '2023-07-11', '13:00:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (24, 5, 2, 21, '2024-12-16', '15:30:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (25, 6, 1, 17, '2024-12-18', '16:00:00', 60, false, NULL);
INSERT INTO public.training_session VALUES (2, 7, 5, 11, '2024-11-28', '14:30:00', 60, true, 25);
INSERT INTO public.training_session VALUES (33, 3, 1, 2, '2025-06-23', '10:30:00', 90, true, 15);
INSERT INTO public.training_session VALUES (19, 3, 1, 19, '2025-06-24', '15:00:00', 90, true, 20);
INSERT INTO public.training_session VALUES (21, 9, 3, 10, '2025-06-23', '11:30:00', 60, true, 30);
INSERT INTO public.training_session VALUES (23, 1, 5, 16, '2025-06-26', '10:30:00', 90, true, 20);
INSERT INTO public.training_session VALUES (30, 2, 1, 12, '2025-06-25', '10:00:00', 90, true, 20);


--
-- TOC entry 4925 (class 0 OID 17352)
-- Dependencies: 227
-- Data for Name: trains; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.trains VALUES (1, 22);
INSERT INTO public.trains VALUES (1, 23);
INSERT INTO public.trains VALUES (1, 12);
INSERT INTO public.trains VALUES (2, 10);
INSERT INTO public.trains VALUES (2, 1);
INSERT INTO public.trains VALUES (2, 22);
INSERT INTO public.trains VALUES (3, 13);
INSERT INTO public.trains VALUES (3, 17);
INSERT INTO public.trains VALUES (4, 3);
INSERT INTO public.trains VALUES (4, 9);
INSERT INTO public.trains VALUES (4, 12);
INSERT INTO public.trains VALUES (5, 11);
INSERT INTO public.trains VALUES (5, 6);
INSERT INTO public.trains VALUES (5, 10);
INSERT INTO public.trains VALUES (6, 6);
INSERT INTO public.trains VALUES (7, 7);
INSERT INTO public.trains VALUES (7, 14);
INSERT INTO public.trains VALUES (7, 13);
INSERT INTO public.trains VALUES (8, 5);
INSERT INTO public.trains VALUES (8, 3);
INSERT INTO public.trains VALUES (8, 21);
INSERT INTO public.trains VALUES (8, 12);
INSERT INTO public.trains VALUES (9, 2);
INSERT INTO public.trains VALUES (9, 25);
INSERT INTO public.trains VALUES (10, 25);
INSERT INTO public.trains VALUES (11, 8);
INSERT INTO public.trains VALUES (12, 24);
INSERT INTO public.trains VALUES (12, 3);
INSERT INTO public.trains VALUES (12, 9);
INSERT INTO public.trains VALUES (12, 12);
INSERT INTO public.trains VALUES (13, 9);
INSERT INTO public.trains VALUES (13, 19);
INSERT INTO public.trains VALUES (14, 23);
INSERT INTO public.trains VALUES (14, 21);
INSERT INTO public.trains VALUES (14, 12);
INSERT INTO public.trains VALUES (15, 14);
INSERT INTO public.trains VALUES (16, 18);
INSERT INTO public.trains VALUES (17, 19);
INSERT INTO public.trains VALUES (18, 13);
INSERT INTO public.trains VALUES (18, 17);
INSERT INTO public.trains VALUES (19, 21);
INSERT INTO public.trains VALUES (19, 3);
INSERT INTO public.trains VALUES (19, 9);
INSERT INTO public.trains VALUES (19, 12);
INSERT INTO public.trains VALUES (20, 15);
INSERT INTO public.trains VALUES (21, 12);
INSERT INTO public.trains VALUES (21, 9);
INSERT INTO public.trains VALUES (22, 10);
INSERT INTO public.trains VALUES (23, 1);
INSERT INTO public.trains VALUES (23, 22);
INSERT INTO public.trains VALUES (23, 23);
INSERT INTO public.trains VALUES (23, 12);
INSERT INTO public.trains VALUES (23, 4);
INSERT INTO public.trains VALUES (23, 16);
INSERT INTO public.trains VALUES (24, 25);
INSERT INTO public.trains VALUES (25, 16);
INSERT INTO public.trains VALUES (30, 12);
INSERT INTO public.trains VALUES (30, 20);
INSERT INTO public.trains VALUES (1, 1);
INSERT INTO public.trains VALUES (30, 1);


--
-- TOC entry 4940 (class 0 OID 0)
-- Dependencies: 215
-- Name: administrator_administrator_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.administrator_administrator_id_seq', 14, true);


--
-- TOC entry 4941 (class 0 OID 0)
-- Dependencies: 217
-- Name: client_client_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_client_id_seq', 30, true);


--
-- TOC entry 4942 (class 0 OID 0)
-- Dependencies: 219
-- Name: coach_coach_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coach_coach_id_seq', 27, true);


--
-- TOC entry 4943 (class 0 OID 0)
-- Dependencies: 221
-- Name: hall_hall_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hall_hall_id_seq', 10, true);


--
-- TOC entry 4944 (class 0 OID 0)
-- Dependencies: 223
-- Name: subscription_subscription_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscription_subscription_id_seq', 28, true);


--
-- TOC entry 4945 (class 0 OID 0)
-- Dependencies: 225
-- Name: training_session_training_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.training_session_training_session_id_seq', 33, true);


--
-- TOC entry 4735 (class 2606 OID 17304)
-- Name: administrator pk_administrator; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrator
    ADD CONSTRAINT pk_administrator PRIMARY KEY (administrator_id);


--
-- TOC entry 4738 (class 2606 OID 17312)
-- Name: client pk_client; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client
    ADD CONSTRAINT pk_client PRIMARY KEY (client_id);


--
-- TOC entry 4742 (class 2606 OID 17320)
-- Name: coach pk_coach; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coach
    ADD CONSTRAINT pk_coach PRIMARY KEY (coach_id);


--
-- TOC entry 4745 (class 2606 OID 17330)
-- Name: hall pk_hall; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hall
    ADD CONSTRAINT pk_hall PRIMARY KEY (hall_id);


--
-- TOC entry 4748 (class 2606 OID 17338)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (subscription_id);


--
-- TOC entry 4753 (class 2606 OID 17347)
-- Name: training_session pk_training_session; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session
    ADD CONSTRAINT pk_training_session PRIMARY KEY (training_session_id);


--
-- TOC entry 4757 (class 2606 OID 17356)
-- Name: trains pk_trains; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trains
    ADD CONSTRAINT pk_trains PRIMARY KEY (training_session_id, client_id);


--
-- TOC entry 4733 (class 1259 OID 17305)
-- Name: administrator_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX administrator_pk ON public.administrator USING btree (administrator_id);


--
-- TOC entry 4736 (class 1259 OID 17313)
-- Name: client_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX client_pk ON public.client USING btree (client_id);


--
-- TOC entry 4739 (class 1259 OID 17322)
-- Name: coach_full_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX coach_full_name_index ON public.coach USING btree (coach_full_name);


--
-- TOC entry 4740 (class 1259 OID 17321)
-- Name: coach_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX coach_pk ON public.coach USING btree (coach_id);


--
-- TOC entry 4750 (class 1259 OID 17351)
-- Name: conducts_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conducts_fk ON public.training_session USING btree (coach_id);


--
-- TOC entry 4743 (class 1259 OID 17331)
-- Name: hall_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX hall_pk ON public.hall USING btree (hall_id);


--
-- TOC entry 4751 (class 1259 OID 17350)
-- Name: makes_up_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX makes_up_fk ON public.training_session USING btree (administrator_id);


--
-- TOC entry 4746 (class 1259 OID 17340)
-- Name: owns_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX owns_fk ON public.subscription USING btree (client_id);


--
-- TOC entry 4749 (class 1259 OID 17339)
-- Name: subscription_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX subscription_pk ON public.subscription USING btree (subscription_id);


--
-- TOC entry 4754 (class 1259 OID 17349)
-- Name: takes_place_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX takes_place_fk ON public.training_session USING btree (hall_id);


--
-- TOC entry 4755 (class 1259 OID 17348)
-- Name: training_session_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX training_session_pk ON public.training_session USING btree (training_session_id);


--
-- TOC entry 4758 (class 1259 OID 17358)
-- Name: trains2_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trains2_fk ON public.trains USING btree (client_id);


--
-- TOC entry 4759 (class 1259 OID 17359)
-- Name: trains_fk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX trains_fk ON public.trains USING btree (training_session_id);


--
-- TOC entry 4760 (class 1259 OID 17357)
-- Name: trains_pk; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX trains_pk ON public.trains USING btree (training_session_id, client_id);


--
-- TOC entry 4767 (class 2620 OID 17421)
-- Name: training_session trigger_check_hall_availability; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_check_hall_availability BEFORE INSERT ON public.training_session FOR EACH ROW EXECUTE FUNCTION public.check_hall_availability();


--
-- TOC entry 4768 (class 2620 OID 17416)
-- Name: trains trigger_check_max_members; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_check_max_members BEFORE INSERT ON public.trains FOR EACH ROW EXECUTE FUNCTION public.check_max_members();


--
-- TOC entry 4761 (class 2606 OID 17360)
-- Name: subscription fk_subscrip_owns_client; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscription
    ADD CONSTRAINT fk_subscrip_owns_client FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4762 (class 2606 OID 17365)
-- Name: training_session fk_training_conducts_coach; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session
    ADD CONSTRAINT fk_training_conducts_coach FOREIGN KEY (coach_id) REFERENCES public.coach(coach_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4763 (class 2606 OID 17370)
-- Name: training_session fk_training_makes_up_administ; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session
    ADD CONSTRAINT fk_training_makes_up_administ FOREIGN KEY (administrator_id) REFERENCES public.administrator(administrator_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4764 (class 2606 OID 17375)
-- Name: training_session fk_training_takes_pla_hall; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_session
    ADD CONSTRAINT fk_training_takes_pla_hall FOREIGN KEY (hall_id) REFERENCES public.hall(hall_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4765 (class 2606 OID 17385)
-- Name: trains fk_trains_trains2_client; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trains
    ADD CONSTRAINT fk_trains_trains2_client FOREIGN KEY (client_id) REFERENCES public.client(client_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


--
-- TOC entry 4766 (class 2606 OID 17380)
-- Name: trains fk_trains_trains_training; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trains
    ADD CONSTRAINT fk_trains_trains_training FOREIGN KEY (training_session_id) REFERENCES public.training_session(training_session_id) ON UPDATE RESTRICT ON DELETE RESTRICT;


-- Completed on 2026-03-07 17:42:11

--
-- PostgreSQL database dump complete
--

